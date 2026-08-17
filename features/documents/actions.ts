"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, count, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, documents, documentVersions, employees, signatures, signees, tenantDocumentSettings } from "@/drizzle/schema";
import { requireTenantAdmin } from "@/lib/auth/get-current-profile";
import { getCurrentTenant } from "@/lib/auth/get-current-tenant";
import { createClient } from "@/lib/supabase/server";
import { generateDocumentBundle } from "@/lib/documents/generate-bundle";
import { renderDocumentToPdf } from "@/lib/pdf/render";
import { applySignatureMarks, appendCertificatePage, dataUrlToBytes, type SignerCertEntry } from "@/lib/pdf/apply-signature";
import { embedVerificationQr } from "@/lib/pdf/embed-verification-qr";
import type { RoleLabels, SignatureBlockLayout } from "@/lib/pdf/chrome";
import { getJobPositionById } from "@/lib/legal/job-positions";
import { FOREIGNER_DOCUMENT_LABELS } from "@/lib/legal/constants";
import { getAppOrigin } from "@/lib/get-app-origin";
import { sendEmail } from "@/lib/email/send";
import { documentCompletedEmail, employerSignatureNeededEmail, signingInvitationEmail } from "@/lib/email/templates";
import { logAuditEvent, listDocumentTimeline, countDocumentVerifications } from "@/lib/audit/log";
import { recordDocumentVersion, listDocumentVersions } from "@/lib/documents/document-service";
import { resolveDocumentParty } from "@/lib/documents/resolve-party";
import { counterpartyConsentText, employerConsentText } from "@/lib/documents/consent-text";
import type { BundleInput, EmployerData, SignatureType } from "@/lib/documents/types";
import type { DocumentCategory } from "@/lib/documents/category-labels";
import type { Document } from "@/types/document";
import { templates } from "@/drizzle/schema";
import { renderTemplateDocumentToPdf } from "@/lib/pdf/render-template";
import { extractPlaceholders, substitutePlaceholders } from "@/features/templates/schema";
import {
  contractBuilderSchema,
  type ContractBuilderValues,
  generateFromTemplatesSchema,
  generateFromTemplatesForSigneeSchema,
} from "./schema";

const DOCUMENTS_BUCKET = "documents";
const SIGNATURES_BUCKET = "signatures";

const getSignatoryFields = async (tenantId: string) => {
  const [settings] = await db
    .select({ signatoryName: tenantDocumentSettings.signatoryName, signatoryTitle: tenantDocumentSettings.signatoryTitle })
    .from(tenantDocumentSettings)
    .where(eq(tenantDocumentSettings.tenantId, tenantId))
    .limit(1);

  return { signatoryName: settings?.signatoryName ?? null, signatoryTitle: settings?.signatoryTitle ?? null };
};

export type GenerateBundleResult = { success: true; bundleId: string } | { success: false; error: string };

// Exactly one of the two — mirrors documents_party_check. Employee documents (the
// Contract Builder / Template flows scoped to an employee) vs. an external signee.
type DocumentPartyInput = { kind: "employee"; employeeId: string } | { kind: "signee"; signeeId: string };

type PersistDocumentInput = {
  profileId: string;
  tenantId: string;
  actorEmail: string;
  party: DocumentPartyInput;
  // Only set for signee-based documents; null/omitted for employee documents,
  // which keep the in-document/certificate hardcoded Polish label fallbacks.
  roleLabels?: RoleLabels | null;
  bundleId: string;
  documentId: string;
  title: string;
  kind: string | null;
  templateId: string | null;
  signatureType: SignatureType;
  signatureLayout: SignatureBlockLayout | null;
  expiresAt: string | null;
  pdfBytes: Uint8Array;
  origin: string;
  // Caller decides: a fresh token per document (Contract Builder) or one shared
  // token across every document in a batch (a "signing session" — see
  // generateDocumentsFromTemplates). Null when no employee signature is needed.
  signingToken: string | null;
  // Defaults to "hr"/null (the documents table's own defaults) when omitted —
  // Contract Builder documents don't set these explicitly.
  category?: DocumentCategory;
  customCategoryLabel?: string | null;
};

type PersistDocumentResult =
  | { success: true; documentId: string; signingLink: { title: string; token: string } | null }
  | { success: false; error: string };

/** Shared by generateContractBundle, generateDocumentsFromTemplates, and generateDocumentsForSignee: uploads the rendered PDF, inserts the documents row, and logs the audit event. */
const persistGeneratedDocument = async (input: PersistDocumentInput): Promise<PersistDocumentResult> => {
  const supabase = await createClient();
  let pdfBytes = input.pdfBytes;

  if (input.signatureType === null) {
    // No signing needed — this is already the final copy, so embed the verification QR now.
    pdfBytes = await embedVerificationQr(pdfBytes, `${input.origin}/verify/${input.documentId}`);
  }

  const partyId = input.party.kind === "employee" ? input.party.employeeId : input.party.signeeId;
  const storagePath = `${input.profileId}/${partyId}/${input.bundleId}/${input.documentId}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, Buffer.from(pdfBytes), { contentType: "application/pdf" });

  if (uploadError) {
    return { success: false, error: `Failed to store ${input.title}: ${uploadError.message}` };
  }

  const needsEmployeeSignature = input.signatureType === "employee" || input.signatureType === "two-party";
  const signingToken = needsEmployeeSignature ? input.signingToken : null;

  const [createdDocument] = await db
    .insert(documents)
    .values({
      id: input.documentId,
      employerId: input.profileId,
      tenantId: input.tenantId,
      employeeId: input.party.kind === "employee" ? input.party.employeeId : null,
      signeeId: input.party.kind === "signee" ? input.party.signeeId : null,
      senderRoleLabel: input.roleLabels?.sender ?? null,
      counterpartyRoleLabel: input.roleLabels?.counterparty ?? null,
      templateId: input.templateId,
      title: input.title,
      kind: input.kind,
      bundleId: input.bundleId,
      signatureType: input.signatureType,
      signatureLayout: input.signatureLayout,
      expiresAt: input.expiresAt,
      status: input.signatureType === null ? "completed" : needsEmployeeSignature ? "waiting" : "draft",
      pdfUrl: storagePath,
      finalPdfUrl: input.signatureType === null ? storagePath : null,
      signingToken,
      ...(input.category ? { category: input.category, customCategoryLabel: input.customCategoryLabel ?? null } : {}),
    })
    .returning({ id: documents.id });

  await logAuditEvent({
    action: "document.generated",
    actorEmail: input.actorEmail,
    tenantId: input.tenantId,
    documentId: createdDocument.id,
    metadata: { kind: input.kind, bundleId: input.bundleId },
  });

  await recordDocumentVersion({
    documentId: createdDocument.id,
    pdfBytes,
    pdfUrl: storagePath,
    note: "Generated",
    actorEmail: input.actorEmail,
  });

  return {
    success: true,
    documentId: createdDocument.id,
    signingLink: signingToken ? { title: input.title, token: signingToken } : null,
  };
};

type LoadValidatedTemplatesResult =
  | { templates: (typeof templates.$inferSelect)[] }
  | { error: string };

/** Shared by generateDocumentsFromTemplates and generateDocumentsForSignee: loads the selected templates (scoped to the employer) and checks every placeholder they use has a value. */
const loadValidatedTemplates = async (
  templateIds: string[],
  employerId: string,
  values: Record<string, string>,
): Promise<LoadValidatedTemplatesResult> => {
  const selectedTemplates = await db
    .select()
    .from(templates)
    .where(and(inArray(templates.id, templateIds), eq(templates.employerId, employerId), isNull(templates.deletedAt)));

  if (selectedTemplates.length !== templateIds.length) {
    return { error: "One or more selected templates could not be found." };
  }

  for (const template of selectedTemplates) {
    const missing = extractPlaceholders(template.content).filter((name) => !values[name]?.trim());
    if (missing.length > 0) {
      return { error: `Missing value for {{${missing[0]}}} (used in "${template.name}")` };
    }
  }

  return { templates: selectedTemplates };
};

const toBundleInput = (
  employee: typeof employees.$inferSelect,
  employer: EmployerData,
  values: ContractBuilderValues,
): BundleInput => {
  const [firstName, ...rest] = employee.fullName.split(" ");
  const position = values.positionId
    ? getJobPositionById(values.positionId)
    : null;

  return {
    employee: {
      firstName: firstName || employee.fullName,
      lastName: rest.join(" "),
      pesel: employee.pesel,
      passportNumber: employee.passportNumber,
      address: employee.address,
      nationality: employee.nationality,
      isForeigner: employee.isForeigner,
      isStudent: employee.isStudent,
      citizenship: employee.citizenship,
      foreignerDocumentType: employee.foreignerDocumentType
        ? FOREIGNER_DOCUMENT_LABELS[employee.foreignerDocumentType]
        : null,
      foreignerDocumentNumber: employee.foreignerDocumentNumber,
      foreignerDocumentExpiry: employee.foreignerDocumentExpiry,
      workBasis: employee.workBasis,
    },
    contract: {
      type: values.contractType,
      startDate: values.startDate,
      endDate: values.endDate || null,
      hourlyRate: values.hourlyRate || null,
      minHours: values.minHours || null,
      monthlyWage: values.monthlyWage || null,
      weeklyHours: values.weeklyHours || null,
      paymentMethod: values.paymentMethod || null,
    },
    position: position
      ? {
          namePl: position.namePl,
          occupationCode: position.occupationCode,
          workplace: position.workplace,
          fullDescription: position.fullDescription,
        }
      : values.customPositionName
        ? {
            namePl: values.customPositionName,
            fullDescription: values.customPositionDescription || undefined,
          }
        : null,
    employer,
  };
};

export const generateContractBundle = async (
  employeeId: string,
  values: unknown,
): Promise<GenerateBundleResult> => {
  const profile = await requireTenantAdmin();
  const parsed = contractBuilderSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [employee, tenant] = await Promise.all([
    db
      .select()
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.employerId, profile.id)))
      .limit(1)
      .then(([row]) => row),
    getCurrentTenant(),
  ]);

  if (!employee) {
    return { success: false, error: "Employee not found" };
  }

  const signatory = await getSignatoryFields(tenant.id);

  const bundleInput = toBundleInput(
    employee,
    {
      name: profile.companyName,
      address: profile.address,
      taxId: profile.taxId,
      regon: profile.regon,
      krs: profile.krs,
      signingPlace: tenant.defaultSigningPlace,
      ...signatory,
    },
    parsed.data,
  );

  const generatedDocs = generateDocumentBundle(bundleInput);
  const bundleId = randomUUID();
  const employeeName = `${bundleInput.employee.firstName} ${bundleInput.employee.lastName}`.trim();
  const pendingSignatures: { title: string; token: string }[] = [];

  const origin = await getAppOrigin();
  const MAIN_CONTRACT_KINDS = ["umowa_zlecenie", "umowa_o_prace"];

  for (const doc of generatedDocs) {
    const { bytes: pdfBytes, signatureLayout } = await renderDocumentToPdf(doc, {
      employer: bundleInput.employer,
      employeeName,
      signDate: new Date().toLocaleDateString("pl-PL"),
    });

    const result = await persistGeneratedDocument({
      profileId: profile.id,
      tenantId: tenant.id,
      actorEmail: profile.email,
      party: { kind: "employee", employeeId },
      bundleId,
      documentId: randomUUID(),
      title: doc.title,
      kind: doc.id,
      templateId: null,
      signatureType: doc.signature,
      signatureLayout,
      expiresAt: MAIN_CONTRACT_KINDS.includes(doc.id) ? parsed.data.endDate || null : null,
      pdfBytes,
      origin,
      signingToken: doc.signature === "employee" || doc.signature === "two-party" ? randomUUID() : null,
    });

    if (!result.success) {
      return result;
    }
    if (result.signingLink) {
      pendingSignatures.push(result.signingLink);
    }
  }

  if (pendingSignatures.length > 0 && employee.email) {
    await sendEmail({
      to: employee.email,
      subject: `${profile.companyName}: documents to sign`,
      html: signingInvitationEmail({
        employeeName,
        companyName: profile.companyName,
        documents: pendingSignatures.map((doc) => ({
          title: doc.title,
          signingUrl: `${origin}/sign/${doc.token}`,
        })),
      }),
    });
  }

  revalidatePath(`/dashboard/employees/${employeeId}/documents`);
  return { success: true, bundleId };
};

/**
 * Fills one or more employer-authored {{placeholder}} templates for one employee — only the
 * checked templates are generated. Every generated document that needs an employee signature
 * shares one signing-session token, so the employee gets a single link that covers the whole
 * batch instead of one email per document.
 */
export const generateDocumentsFromTemplates = async (
  employeeId: string,
  values: unknown,
): Promise<GenerateBundleResult> => {
  const profile = await requireTenantAdmin();
  const parsed = generateFromTemplatesSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [employee, tenant] = await Promise.all([
    db
      .select()
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.employerId, profile.id)))
      .limit(1)
      .then(([row]) => row),
    getCurrentTenant(),
  ]);

  if (!employee) {
    return { success: false, error: "Employee not found" };
  }

  const signatory = await getSignatoryFields(tenant.id);

  const loaded = await loadValidatedTemplates(parsed.data.templateIds, profile.id, parsed.data.values);
  if ("error" in loaded) {
    return { success: false, error: loaded.error };
  }

  const bundleId = randomUUID();
  const origin = await getAppOrigin();
  const needsEmployeeSignature = parsed.data.signatureType === "employee" || parsed.data.signatureType === "two-party";
  const sessionToken = needsEmployeeSignature ? randomUUID() : null;
  const pendingDocuments: { documentId: string; title: string }[] = [];

  for (const template of loaded.templates) {
    const body = substitutePlaceholders(template.content, parsed.data.values);
    const { bytes: pdfBytes, signatureLayout } = await renderTemplateDocumentToPdf(
      template.name,
      body,
      {
        name: profile.companyName,
        address: profile.address,
        taxId: profile.taxId,
        regon: profile.regon,
        krs: profile.krs,
        signingPlace: tenant.defaultSigningPlace,
        ...signatory,
      },
      {
        employeeName: employee.fullName,
        signDate: new Date().toLocaleDateString("pl-PL"),
        signatureType: parsed.data.signatureType,
      },
    );

    const result = await persistGeneratedDocument({
      profileId: profile.id,
      tenantId: tenant.id,
      actorEmail: profile.email,
      party: { kind: "employee", employeeId },
      bundleId,
      documentId: randomUUID(),
      title: template.name,
      kind: null,
      templateId: template.id,
      signatureType: parsed.data.signatureType,
      signatureLayout,
      expiresAt: null,
      pdfBytes,
      origin,
      signingToken: sessionToken,
      category: template.category,
      customCategoryLabel: template.customCategoryLabel,
    });

    if (!result.success) {
      return result;
    }
    if (result.signingLink) {
      pendingDocuments.push({ documentId: result.documentId, title: result.signingLink.title });
    }
  }

  if (sessionToken && pendingDocuments.length > 0 && employee.email) {
    await sendEmail({
      to: employee.email,
      subject: `${profile.companyName}: documents to sign`,
      html: signingInvitationEmail({
        employeeName: employee.fullName,
        companyName: profile.companyName,
        documents: pendingDocuments.map(({ title }) => ({ title, signingUrl: `${origin}/sign/${sessionToken}` })),
      }),
    });
    for (const { documentId } of pendingDocuments) {
      await logAuditEvent({
        action: "document.sent",
        actorEmail: profile.email,
        documentId,
        metadata: { to: employee.email, bundleId, sessionDocumentCount: pendingDocuments.length },
      });
    }
  }

  revalidatePath(`/dashboard/employees/${employeeId}/documents`);
  return { success: true, bundleId };
};

/**
 * Fills one or more employer-authored {{placeholder}} templates for an external
 * signee (not an employee) — the counterpart to generateDocumentsFromTemplates.
 * Kept as a separate action rather than branching the employee one so the
 * employee flow's call sites and generated bytes are entirely unaffected.
 */
export const generateDocumentsForSignee = async (
  signeeId: string,
  values: unknown,
): Promise<GenerateBundleResult> => {
  const profile = await requireTenantAdmin();
  const parsed = generateFromTemplatesForSigneeSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [signee, tenant] = await Promise.all([
    db
      .select()
      .from(signees)
      .where(and(eq(signees.id, signeeId), eq(signees.employerId, profile.id), isNull(signees.deletedAt)))
      .limit(1)
      .then(([row]) => row),
    getCurrentTenant(),
  ]);

  if (!signee) {
    return { success: false, error: "Signee not found" };
  }

  const signatory = await getSignatoryFields(tenant.id);

  const loaded = await loadValidatedTemplates(parsed.data.templateIds, profile.id, parsed.data.values);
  if ("error" in loaded) {
    return { success: false, error: loaded.error };
  }

  const bundleId = randomUUID();
  const origin = await getAppOrigin();
  const needsSigneeSignature = parsed.data.signatureType === "employee" || parsed.data.signatureType === "two-party";
  const sessionToken = needsSigneeSignature ? randomUUID() : null;
  const pendingDocuments: { documentId: string; title: string }[] = [];
  const roleLabels: RoleLabels = { sender: parsed.data.senderRoleLabel, counterparty: parsed.data.counterpartyRoleLabel };
  const partyDisplayName = signee.companyName ? `${signee.fullName} — ${signee.companyName}` : signee.fullName;

  for (const template of loaded.templates) {
    const body = substitutePlaceholders(template.content, parsed.data.values);
    const { bytes: pdfBytes, signatureLayout } = await renderTemplateDocumentToPdf(
      template.name,
      body,
      {
        name: profile.companyName,
        address: profile.address,
        taxId: profile.taxId,
        regon: profile.regon,
        krs: profile.krs,
        signingPlace: tenant.defaultSigningPlace,
        ...signatory,
      },
      {
        employeeName: partyDisplayName,
        signDate: new Date().toLocaleDateString("pl-PL"),
        signatureType: parsed.data.signatureType,
        roleLabels,
      },
    );

    const result = await persistGeneratedDocument({
      profileId: profile.id,
      tenantId: tenant.id,
      actorEmail: profile.email,
      party: { kind: "signee", signeeId },
      roleLabels,
      bundleId,
      documentId: randomUUID(),
      title: template.name,
      kind: null,
      templateId: template.id,
      signatureType: parsed.data.signatureType,
      signatureLayout,
      expiresAt: null,
      pdfBytes,
      origin,
      signingToken: sessionToken,
      category: template.category,
      customCategoryLabel: template.customCategoryLabel,
    });

    if (!result.success) {
      return result;
    }
    if (result.signingLink) {
      pendingDocuments.push({ documentId: result.documentId, title: result.signingLink.title });
    }
  }

  if (sessionToken && pendingDocuments.length > 0 && signee.email) {
    await sendEmail({
      to: signee.email,
      subject: `${profile.companyName}: documents to sign`,
      html: signingInvitationEmail({
        employeeName: partyDisplayName,
        companyName: profile.companyName,
        documents: pendingDocuments.map(({ title }) => ({ title, signingUrl: `${origin}/sign/${sessionToken}` })),
      }),
    });
    for (const { documentId } of pendingDocuments) {
      await logAuditEvent({
        action: "document.sent",
        actorEmail: profile.email,
        documentId,
        metadata: { to: signee.email, bundleId, sessionDocumentCount: pendingDocuments.length },
      });
    }
  }

  revalidatePath("/dashboard/documents");
  return { success: true, bundleId };
};

const DOCUMENTS_PAGE_SIZE = 10;

export type DocumentListItem = {
  id: string;
  title: string;
  status: Document["status"];
  category: Document["category"];
  customCategoryLabel: string | null;
  createdAt: Date;
  partyId: string;
  partyName: string;
};

export type ListDocumentsFilters = {
  status?: Document["status"];
  category?: Document["category"];
};

// Both joins are left joins because a document has exactly one of employeeId/signeeId
// set (documents_party_check) — an inner join on either alone would silently exclude
// every document of the other kind.
const partyIdExpr = sql<string>`coalesce(${documents.employeeId}, ${documents.signeeId})`;
const partyNameExpr = sql<string>`coalesce(${employees.fullName}, ${signees.fullName})`;

/** Cross-employee/signee document index for the dashboard's Documents list page. Excludes soft-deleted documents. */
export const listDocuments = async (
  search: string,
  page: number,
  filters: ListDocumentsFilters = {},
) => {
  const profile = await requireTenantAdmin();

  const whereClause = and(
    eq(documents.employerId, profile.id),
    isNull(documents.deletedAt),
    or(isNull(documents.employeeId), isNull(employees.deletedAt)),
    or(isNull(documents.signeeId), isNull(signees.deletedAt)),
    filters.status ? eq(documents.status, filters.status) : undefined,
    filters.category ? eq(documents.category, filters.category) : undefined,
    search
      ? or(ilike(documents.title, `%${search}%`), ilike(employees.fullName, `%${search}%`), ilike(signees.fullName, `%${search}%`))
      : undefined,
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: documents.id,
        title: documents.title,
        status: documents.status,
        category: documents.category,
        customCategoryLabel: documents.customCategoryLabel,
        createdAt: documents.createdAt,
        partyId: partyIdExpr,
        partyName: partyNameExpr,
      })
      .from(documents)
      .leftJoin(employees, eq(documents.employeeId, employees.id))
      .leftJoin(signees, eq(documents.signeeId, signees.id))
      .where(whereClause)
      .orderBy(desc(documents.createdAt))
      .limit(DOCUMENTS_PAGE_SIZE)
      .offset((page - 1) * DOCUMENTS_PAGE_SIZE),
    db
      .select({ total: count() })
      .from(documents)
      .leftJoin(employees, eq(documents.employeeId, employees.id))
      .leftJoin(signees, eq(documents.signeeId, signees.id))
      .where(whereClause),
  ]);

  return { documents: rows, total, pageSize: DOCUMENTS_PAGE_SIZE };
};

/** Full detail for one document: metadata, version history, timeline, and verification count. */
export const getDocumentDetail = async (documentId: string) => {
  const profile = await requireTenantAdmin();

  const [row] = await db
    .select({ document: documents, partyName: partyNameExpr })
    .from(documents)
    .leftJoin(employees, eq(documents.employeeId, employees.id))
    .leftJoin(signees, eq(documents.signeeId, signees.id))
    .where(and(eq(documents.id, documentId), eq(documents.employerId, profile.id)))
    .limit(1);

  if (!row) return null;

  const [versions, timeline, verificationCount] = await Promise.all([
    listDocumentVersions(documentId),
    listDocumentTimeline(documentId),
    countDocumentVerifications(documentId),
  ]);

  return {
    document: row.document,
    partyName: row.partyName,
    versions,
    timeline,
    verificationCount,
  };
};

export type MutationResult = { success: true } | { success: false; error: string };

const getOwnedDocument = async (documentId: string, employerId: string) => {
  const [document] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.employerId, employerId)))
    .limit(1);

  return document;
};

/** Lets an employer reclassify a document after the fact (the initial category is only ever a default or inherited from its template). */
export const updateDocumentCategory = async (
  documentId: string,
  category: DocumentCategory,
  customCategoryLabel: string | null,
): Promise<MutationResult> => {
  const profile = await requireTenantAdmin();
  const document = await getOwnedDocument(documentId, profile.id);
  if (!document) return { success: false, error: "Document not found" };

  if (category === "custom" && !customCategoryLabel?.trim()) {
    return { success: false, error: "Enter a label for the custom category" };
  }

  await db
    .update(documents)
    .set({ category, customCategoryLabel: category === "custom" ? customCategoryLabel : null, updatedAt: new Date() })
    .where(eq(documents.id, documentId));

  revalidatePath("/dashboard/documents");
  revalidatePath(`/dashboard/documents/${documentId}`);
  return { success: true };
};

export const softDeleteDocument = async (documentId: string): Promise<MutationResult> => {
  const profile = await requireTenantAdmin();
  const document = await getOwnedDocument(documentId, profile.id);
  if (!document) return { success: false, error: "Document not found" };

  await db.update(documents).set({ deletedAt: new Date() }).where(eq(documents.id, documentId));
  await logAuditEvent({ action: "document.deleted", actorEmail: profile.email, documentId });

  revalidatePath("/dashboard/documents");
  revalidatePath(`/dashboard/documents/${documentId}`);
  return { success: true };
};

/** Bulk version of softDeleteDocument, for the Documents list's multi-select toolbar. Re-derives ownership from the DB rather than trusting the client-supplied id list. */
export const bulkSoftDeleteDocuments = async (documentIds: string[]): Promise<MutationResult> => {
  const profile = await requireTenantAdmin();
  if (documentIds.length === 0) return { success: true };

  const owned = await db
    .select({ id: documents.id })
    .from(documents)
    .where(
      and(
        inArray(documents.id, documentIds),
        eq(documents.employerId, profile.id),
        isNull(documents.deletedAt),
      ),
    );

  if (owned.length === 0) return { success: false, error: "No matching documents found" };

  const ownedIds = owned.map((row) => row.id);
  await db.update(documents).set({ deletedAt: new Date() }).where(inArray(documents.id, ownedIds));
  await Promise.all(
    ownedIds.map((documentId) => logAuditEvent({ action: "document.deleted", actorEmail: profile.email, documentId })),
  );

  revalidatePath("/dashboard/documents");
  return { success: true };
};

export const restoreDocument = async (documentId: string): Promise<MutationResult> => {
  const profile = await requireTenantAdmin();
  const document = await getOwnedDocument(documentId, profile.id);
  if (!document) return { success: false, error: "Document not found" };

  await db.update(documents).set({ deletedAt: null }).where(eq(documents.id, documentId));
  await logAuditEvent({ action: "document.restored", actorEmail: profile.email, documentId });

  revalidatePath("/dashboard/documents");
  revalidatePath(`/dashboard/documents/${documentId}`);
  return { success: true };
};

/** Re-sends the invitation/reminder email to whichever party's turn it currently is, reusing the existing signing token — no new link is issued. */
export const resendDocumentSigningEmail = async (documentId: string): Promise<MutationResult> => {
  const profile = await requireTenantAdmin();
  const document = await getOwnedDocument(documentId, profile.id);
  if (!document) return { success: false, error: "Document not found" };

  const party = await resolveDocumentParty(document);
  const origin = await getAppOrigin();

  if (document.status === "waiting" && document.signingToken && party?.email) {
    await sendEmail({
      to: party.email,
      subject: `Reminder: ${profile.companyName} — documents to sign`,
      html: signingInvitationEmail({
        employeeName: party.name,
        companyName: profile.companyName,
        documents: [{ title: document.title, signingUrl: `${origin}/sign/${document.signingToken}` }],
      }),
    });
    await logAuditEvent({
      action: "document.sent",
      actorEmail: profile.email,
      documentId,
      metadata: { to: party.email, resent: true },
    });
    return { success: true };
  }

  const awaitingEmployer =
    document.status === "employee_signed" || (document.status === "draft" && document.signatureType === "employer");

  if (awaitingEmployer) {
    await sendEmail({
      to: profile.email,
      subject: `Reminder: ${document.title} — ready for your signature`,
      html: employerSignatureNeededEmail({
        documentTitle: document.title,
        employeeName: party?.name ?? "",
        dashboardUrl: `${origin}/dashboard/documents/${document.id}`,
      }),
    });
    await logAuditEvent({
      action: "document.sent",
      actorEmail: profile.email,
      documentId,
      metadata: { to: profile.email, resent: true },
    });
    return { success: true };
  }

  return { success: false, error: "This document has no pending signature to send a reminder for." };
};

export const listDocumentBundles = async (employeeId: string) => {
  const profile = await requireTenantAdmin();

  const rows = await db
    .select()
    .from(documents)
    .where(and(eq(documents.employeeId, employeeId), eq(documents.employerId, profile.id)))
    .orderBy(desc(documents.createdAt));

  const bundles = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.bundleId ?? row.id;
    const existing = bundles.get(key) ?? [];
    existing.push(row);
    bundles.set(key, existing);
  }

  return Array.from(bundles.entries()).map(([bundleId, docs]) => ({ bundleId, documents: docs }));
};

export const listDocumentAuditLog = async (employeeId: string) => {
  const profile = await requireTenantAdmin();

  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      actorEmail: auditLogs.actorEmail,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      documentTitle: documents.title,
    })
    .from(auditLogs)
    .innerJoin(documents, eq(auditLogs.documentId, documents.id))
    .where(and(eq(documents.employeeId, employeeId), eq(documents.employerId, profile.id)))
    .orderBy(desc(auditLogs.createdAt));
};

export const getDocumentDownloadUrl = async (documentId: string) => {
  const profile = await requireTenantAdmin();

  const [document] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.employerId, profile.id)))
    .limit(1);

  if (!document?.pdfUrl) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(document.pdfUrl, 60 * 10);

  if (error) {
    return null;
  }

  await logAuditEvent({ action: "document.downloaded", actorEmail: profile.email, documentId });
  return data.signedUrl;
};

/** Same signed URL as getDocumentDownloadUrl, but for inline preview — deliberately not logged as a download. */
export const getDocumentPreviewUrl = async (documentId: string) => {
  const profile = await requireTenantAdmin();
  const document = await getOwnedDocument(documentId, profile.id);
  if (!document?.pdfUrl) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(document.pdfUrl, 60 * 10);
  return error ? null : data.signedUrl;
};

/** Signer/IP/browser rows for the Audit Report tab. */
export const getDocumentSignatures = async (documentId: string) => {
  const profile = await requireTenantAdmin();
  const document = await getOwnedDocument(documentId, profile.id);
  if (!document) return [];

  return db.select().from(signatures).where(eq(signatures.documentId, documentId)).orderBy(signatures.signedAt);
};

/** Signed URL for one specific historical version, so past versions stay downloadable even after newer ones are recorded. */
export const getVersionDownloadUrl = async (documentId: string, versionId: string) => {
  const profile = await requireTenantAdmin();
  const document = await getOwnedDocument(documentId, profile.id);
  if (!document) return null;

  const [version] = await db
    .select()
    .from(documentVersions)
    .where(and(eq(documentVersions.id, versionId), eq(documentVersions.documentId, documentId)))
    .limit(1);

  if (!version) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(version.pdfUrl, 60 * 10);
  return error ? null : data.signedUrl;
};

export type SignAsEmployerResult = { success: true } | { success: false; error: string };

/** Signs an employer-only or two-party document from the authenticated dashboard. */
export const signAsEmployer = async (
  documentId: string,
  signatureDataUrl: string,
): Promise<SignAsEmployerResult> => {
  const profile = await requireTenantAdmin();

  const [document] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.employerId, profile.id)))
    .limit(1);

  if (!document) {
    return { success: false, error: "Document not found" };
  }

  const canSignNow =
    (document.signatureType === "employer" && document.status === "draft") ||
    (document.signatureType === "two-party" && document.status === "employee_signed");

  if (!canSignNow || !document.pdfUrl) {
    return { success: false, error: "This document is not awaiting your signature." };
  }

  const supabase = await createClient();
  const { data: pdfData, error: downloadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(document.pdfUrl);

  if (downloadError || !pdfData) {
    return { success: false, error: "Could not load the document to sign." };
  }

  const headerList = await headers();
  const ipAddress = headerList.get("x-forwarded-for");
  const userAgent = headerList.get("user-agent");

  const marked = await applySignatureMarks(new Uint8Array(await pdfData.arrayBuffer()), {
    role: "employer",
    layout: document.signatureLayout as SignatureBlockLayout | null,
    signatureDataUrl,
    stampUrl: profile.logoUrl,
  });

  const senderEntry: SignerCertEntry = {
    roleLabel: document.senderRoleLabel ?? "Pracodawca / Zleceniodawca",
    name: profile.companyName,
    email: profile.email,
    signedAt: new Date(),
    ipAddress,
    userAgent,
    consentText: employerConsentText(profile.companyName),
    signatureImageBytes: dataUrlToBytes(signatureDataUrl),
  };

  let signedPdfBytes: Uint8Array;
  if (document.signatureType === "two-party") {
    // The employee/counterparty already signed (status employee_signed) — that
    // signature only stamped the marks, with no certificate page yet (see
    // submitEmployeeSignature). Reconstruct their certificate entry from the
    // stored signature row so both signers land on one shared certificate page.
    const [firstSignature] = await db
      .select()
      .from(signatures)
      .where(eq(signatures.documentId, document.id))
      .orderBy(signatures.signedAt)
      .limit(1);

    if (!firstSignature) {
      return { success: false, error: "The counterparty's signature could not be found." };
    }

    const { data: firstSignatureImage, error: firstSignatureImageError } = await supabase.storage
      .from(SIGNATURES_BUCKET)
      .download(firstSignature.imageUrl);

    if (firstSignatureImageError || !firstSignatureImage) {
      return { success: false, error: "Could not load the counterparty's signature." };
    }

    const counterparty = await resolveDocumentParty(document);
    const counterpartyEntry: SignerCertEntry = {
      roleLabel: document.counterpartyRoleLabel ?? "Pracownik / Zleceniobiorca",
      name: counterparty?.name ?? firstSignature.signerEmail,
      email: counterparty?.email ?? firstSignature.signerEmail,
      signedAt: firstSignature.signedAt,
      ipAddress: firstSignature.ipAddress,
      userAgent: firstSignature.userAgent,
      consentText: counterpartyConsentText(profile.companyName),
      signatureImageBytes: new Uint8Array(await firstSignatureImage.arrayBuffer()),
    };

    signedPdfBytes = await appendCertificatePage(marked, {
      documentId: document.id,
      documentTitle: document.title,
      sha256Hash: document.sha256Hash,
      signers: [counterpartyEntry, senderEntry],
    });
  } else {
    signedPdfBytes = await appendCertificatePage(marked, {
      documentId: document.id,
      documentTitle: document.title,
      sha256Hash: document.sha256Hash,
      signers: [senderEntry],
    });
  }

  // documents_party_check guarantees exactly one of these is set.
  const partyId = document.employeeId ?? document.signeeId;

  // document.kind is null for every template-generated document — falling back to
  // document.id keeps each document's final PDF at its own storage key instead of
  // multiple documents in the same bundle colliding on "null-final.pdf" and
  // overwriting each other's signed contract (see signing-actions.ts's employee-side
  // upload path, which uses the same fallback for the same reason).
  const finalPath = `${document.employerId}/${partyId}/${document.bundleId}/${document.kind ?? document.id}-final.pdf`;
  const finalPdfBytes = await embedVerificationQr(
    signedPdfBytes,
    `${await getAppOrigin()}/verify/${document.id}`,
  );
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(finalPath, Buffer.from(finalPdfBytes), { contentType: "application/pdf" });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const signatureImagePath = `${document.employerId}/${partyId}/${document.id}-employer.png`;
  const signatureBase64 = signatureDataUrl.split(",")[1] ?? "";
  await supabase.storage
    .from(SIGNATURES_BUCKET)
    .upload(signatureImagePath, Buffer.from(signatureBase64, "base64"), { contentType: "image/png" });

  await db.insert(signatures).values({
    documentId: document.id,
    signerEmail: profile.email,
    imageUrl: signatureImagePath,
    ipAddress,
    userAgent,
  });

  await db
    .update(documents)
    .set({ status: "completed", pdfUrl: finalPath, finalPdfUrl: finalPath, updatedAt: new Date() })
    .where(eq(documents.id, document.id));

  await logAuditEvent({
    action: "document.signed_by_employer",
    actorEmail: profile.email,
    documentId: document.id,
  });
  await logAuditEvent({
    action: "document.completed",
    actorEmail: profile.email,
    documentId: document.id,
  });

  await recordDocumentVersion({
    documentId: document.id,
    pdfBytes: finalPdfBytes,
    pdfUrl: finalPath,
    note: "Employer signed — completed",
    actorEmail: profile.email,
  });

  const party = await resolveDocumentParty(document);
  if (party?.email) {
    await sendEmail({
      to: party.email,
      subject: `${document.title} — completed`,
      html: documentCompletedEmail({ documentTitle: document.title, recipientName: party.name }),
    });
  }

  revalidatePath(document.employeeId ? `/dashboard/employees/${document.employeeId}/documents` : "/dashboard/documents");
  return { success: true };
};
