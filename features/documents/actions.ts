"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, documents, employees, signatures } from "@/drizzle/schema";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { generateDocumentBundle } from "@/lib/documents/generate-bundle";
import { renderDocumentToPdf } from "@/lib/pdf/render";
import { applySignatureToDocument } from "@/lib/pdf/apply-signature";
import { embedVerificationQr } from "@/lib/pdf/embed-verification-qr";
import type { SignatureBlockLayout } from "@/lib/pdf/chrome";
import { getJobPositionById } from "@/lib/legal/job-positions";
import { FOREIGNER_DOCUMENT_LABELS } from "@/lib/legal/constants";
import { getAppOrigin } from "@/lib/get-app-origin";
import { sendEmail } from "@/lib/email/send";
import { documentCompletedEmail, signingInvitationEmail } from "@/lib/email/templates";
import { logAuditEvent } from "@/lib/audit/log";
import type { BundleInput, SignatureType } from "@/lib/documents/types";
import { templates } from "@/drizzle/schema";
import { renderTemplateDocumentToPdf } from "@/lib/pdf/render-template";
import { extractPlaceholders, substitutePlaceholders } from "@/features/templates/schema";
import { contractBuilderSchema, type ContractBuilderValues, generateFromTemplateSchema } from "./schema";

const DOCUMENTS_BUCKET = "documents";
const SIGNATURES_BUCKET = "signatures";

export type GenerateBundleResult = { success: true; bundleId: string } | { success: false; error: string };

type PersistDocumentInput = {
  profileId: string;
  actorEmail: string;
  employeeId: string;
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
};

type PersistDocumentResult =
  | { success: true; signingLink: { title: string; token: string } | null }
  | { success: false; error: string };

/** Shared by generateContractBundle and generateDocumentFromTemplate: uploads the rendered PDF, inserts the documents row, and logs the audit event. */
const persistGeneratedDocument = async (input: PersistDocumentInput): Promise<PersistDocumentResult> => {
  const supabase = await createClient();
  let pdfBytes = input.pdfBytes;

  if (input.signatureType === null) {
    // No signing needed — this is already the final copy, so embed the verification QR now.
    pdfBytes = await embedVerificationQr(pdfBytes, `${input.origin}/verify/${input.documentId}`);
  }

  const storagePath = `${input.profileId}/${input.employeeId}/${input.bundleId}/${input.documentId}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, Buffer.from(pdfBytes), { contentType: "application/pdf" });

  if (uploadError) {
    return { success: false, error: `Failed to store ${input.title}: ${uploadError.message}` };
  }

  const needsEmployeeSignature = input.signatureType === "employee" || input.signatureType === "two-party";
  const signingToken = needsEmployeeSignature ? randomUUID() : null;

  const [createdDocument] = await db
    .insert(documents)
    .values({
      id: input.documentId,
      employerId: input.profileId,
      employeeId: input.employeeId,
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
    })
    .returning({ id: documents.id });

  await logAuditEvent({
    action: "document.generated",
    actorEmail: input.actorEmail,
    documentId: createdDocument.id,
    metadata: { kind: input.kind, bundleId: input.bundleId },
  });

  return { success: true, signingLink: signingToken ? { title: input.title, token: signingToken } : null };
};

const toBundleInput = (
  employee: typeof employees.$inferSelect,
  employer: { name: string; address: string | null; taxId: string | null; regon: string | null; krs: string | null },
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
  const profile = await getCurrentProfile();
  const parsed = contractBuilderSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [employee] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.employerId, profile.id)))
    .limit(1);

  if (!employee) {
    return { success: false, error: "Employee not found" };
  }

  const bundleInput = toBundleInput(
    employee,
    {
      name: profile.companyName,
      address: profile.address,
      taxId: profile.taxId,
      regon: profile.regon,
      krs: profile.krs,
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
      actorEmail: profile.email,
      employeeId,
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

/** Fills an employer-authored {{placeholder}} template for one employee and starts the same sign/send flow as generateContractBundle. */
export const generateDocumentFromTemplate = async (
  employeeId: string,
  values: unknown,
): Promise<GenerateBundleResult> => {
  const profile = await getCurrentProfile();
  const parsed = generateFromTemplateSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [employee] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.employerId, profile.id)))
    .limit(1);

  if (!employee) {
    return { success: false, error: "Employee not found" };
  }

  const [template] = await db
    .select()
    .from(templates)
    .where(and(eq(templates.id, parsed.data.templateId), eq(templates.employerId, profile.id)))
    .limit(1);

  if (!template) {
    return { success: false, error: "Template not found" };
  }

  const missing = extractPlaceholders(template.content).filter((name) => !parsed.data.values[name]?.trim());
  if (missing.length > 0) {
    return { success: false, error: `Missing value for {{${missing[0]}}}` };
  }

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
    },
    {
      employeeName: employee.fullName,
      signDate: new Date().toLocaleDateString("pl-PL"),
      signatureType: parsed.data.signatureType,
    },
  );

  const bundleId = randomUUID();
  const origin = await getAppOrigin();

  const result = await persistGeneratedDocument({
    profileId: profile.id,
    actorEmail: profile.email,
    employeeId,
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
  });

  if (!result.success) {
    return result;
  }

  if (result.signingLink && employee.email) {
    await sendEmail({
      to: employee.email,
      subject: `${profile.companyName}: documents to sign`,
      html: signingInvitationEmail({
        employeeName: employee.fullName,
        companyName: profile.companyName,
        documents: [{ title: result.signingLink.title, signingUrl: `${origin}/sign/${result.signingLink.token}` }],
      }),
    });
  }

  revalidatePath(`/dashboard/employees/${employeeId}/documents`);
  return { success: true, bundleId };
};

export const listDocumentBundles = async (employeeId: string) => {
  const profile = await getCurrentProfile();

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
  const profile = await getCurrentProfile();

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
  const profile = await getCurrentProfile();

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

  return data.signedUrl;
};

export type SignAsEmployerResult = { success: true } | { success: false; error: string };

/** Signs an employer-only or two-party document from the authenticated dashboard. */
export const signAsEmployer = async (
  documentId: string,
  signatureDataUrl: string,
): Promise<SignAsEmployerResult> => {
  const profile = await getCurrentProfile();

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

  const signedPdfBytes = await applySignatureToDocument(new Uint8Array(await pdfData.arrayBuffer()), {
    role: "employer",
    layout: document.signatureLayout as SignatureBlockLayout | null,
    signerLabel: "Pracodawca / Zleceniodawca",
    signerName: profile.companyName,
    signatureDataUrl,
    consentText: "Podpis reprezentanta pracodawcy/zleceniodawcy potwierdzający zawarcie i warunki niniejszego dokumentu.",
    signedAt: new Date(),
    ipAddress: null,
    stampUrl: profile.logoUrl,
  });

  const finalPath = `${document.employerId}/${document.employeeId}/${document.bundleId}/${document.kind}-final.pdf`;
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

  const signatureImagePath = `${document.employerId}/${document.employeeId}/${document.id}-employer.png`;
  const signatureBase64 = signatureDataUrl.split(",")[1] ?? "";
  await supabase.storage
    .from(SIGNATURES_BUCKET)
    .upload(signatureImagePath, Buffer.from(signatureBase64, "base64"), { contentType: "image/png" });

  await db.insert(signatures).values({
    documentId: document.id,
    signerEmail: profile.email,
    imageUrl: signatureImagePath,
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

  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, document.employeeId))
    .limit(1);

  if (employee?.email) {
    await sendEmail({
      to: employee.email,
      subject: `${document.title} — completed`,
      html: documentCompletedEmail({ documentTitle: document.title, recipientName: employee.fullName }),
    });
  }

  revalidatePath(`/dashboard/employees/${document.employeeId}/documents`);
  return { success: true };
};
