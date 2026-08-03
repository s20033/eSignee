"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, asc, desc, eq, isNotNull, isNull, lte, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { employees, identityDocuments } from "@/drizzle/schema";
import { getCurrentPortalUser } from "@/lib/auth/get-current-portal-user";
import { requireTenantAdmin } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit/log";
import { toCsv } from "@/lib/csv";
import {
  IDENTITY_DOCUMENT_TYPES,
  IDENTITY_DOCUMENT_TYPE_LABELS,
  IDENTITY_DOCUMENT_VERIFICATION_STATUSES,
  MAX_IDENTITY_DOCUMENT_SIZE_BYTES,
  rejectIdentityDocumentSchema,
  uploadIdentityDocumentSchema,
  type IdentityDocumentType,
  type IdentityDocumentVerificationStatus,
} from "./schema";

const isIdentityDocumentType = (value: string): value is IdentityDocumentType =>
  (IDENTITY_DOCUMENT_TYPES as readonly string[]).includes(value);

const isVerificationStatus = (value: string): value is IdentityDocumentVerificationStatus =>
  (IDENTITY_DOCUMENT_VERIFICATION_STATUSES as readonly string[]).includes(value);

const BUCKET = "identity-documents";

export type IdentityDocumentActionResult = { success: true } | { success: false; error: string };

/** Employee-facing: their own identity documents, newest first. */
export const listMyIdentityDocuments = async () => {
  const { employee } = await getCurrentPortalUser();

  return db
    .select()
    .from(identityDocuments)
    .where(eq(identityDocuments.employeeId, employee.id))
    .orderBy(desc(identityDocuments.createdAt));
};

export const uploadIdentityDocument = async (formData: FormData): Promise<IdentityDocumentActionResult> => {
  const { employee } = await getCurrentPortalUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Choose a file to upload." };
  }

  // Never trust the client's own size check — re-validate server-side.
  if (file.size > MAX_IDENTITY_DOCUMENT_SIZE_BYTES) {
    return { success: false, error: "File must be 2 MB or smaller." };
  }

  const parsed = uploadIdentityDocumentSchema.safeParse({
    type: formData.get("type"),
    documentNumber: formData.get("documentNumber") ?? "",
    issuingCountry: formData.get("issuingCountry") ?? "",
    issueDate: formData.get("issueDate") ?? "",
    expiryDate: formData.get("expiryDate") ?? "",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : undefined;
  const storagePath = `${employee.tenantId}/${employee.id}/${randomUUID()}${extension ? `.${extension}` : ""}`;

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type || "application/octet-stream" });

  if (uploadError) {
    return { success: false, error: `Upload failed: ${uploadError.message}` };
  }

  await db.insert(identityDocuments).values({
    employeeId: employee.id,
    tenantId: employee.tenantId,
    type: parsed.data.type,
    documentNumber: parsed.data.documentNumber || null,
    issuingCountry: parsed.data.issuingCountry || null,
    issueDate: parsed.data.issueDate || null,
    expiryDate: parsed.data.expiryDate || null,
    fileRef: storagePath,
    fileSizeBytes: file.size,
  });

  await logAuditEvent({
    action: "identity_document.uploaded",
    actorEmail: employee.email,
    tenantId: employee.tenantId,
    metadata: { employeeId: employee.id, type: parsed.data.type },
  });

  revalidatePath("/portal/identity-documents");
  return { success: true };
};

/** Employee-facing signed URL for one of their own uploads. */
export const getMyIdentityDocumentSignedUrl = async (id: string) => {
  const { employee } = await getCurrentPortalUser();

  const [doc] = await db
    .select({ fileRef: identityDocuments.fileRef })
    .from(identityDocuments)
    .where(and(eq(identityDocuments.id, id), eq(identityDocuments.employeeId, employee.id)))
    .limit(1);

  if (!doc) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.fileRef, 60 * 10);
  return error ? null : data.signedUrl;
};

/** Tenant Admin-facing: every identity document awaiting review, oldest first, with the employee's name. */
export const listPendingIdentityDocumentReviews = async () => {
  const profile = await requireTenantAdmin();

  return db
    .select({
      id: identityDocuments.id,
      type: identityDocuments.type,
      documentNumber: identityDocuments.documentNumber,
      issuingCountry: identityDocuments.issuingCountry,
      issueDate: identityDocuments.issueDate,
      expiryDate: identityDocuments.expiryDate,
      createdAt: identityDocuments.createdAt,
      employeeName: employees.fullName,
    })
    .from(identityDocuments)
    .innerJoin(employees, eq(identityDocuments.employeeId, employees.id))
    .where(
      and(
        eq(identityDocuments.tenantId, profile.tenantId),
        eq(identityDocuments.verificationStatus, "pending_review"),
      ),
    )
    .orderBy(asc(identityDocuments.createdAt));
};

/** Powers the dashboard sidebar's "ID reviews" badge. */
export const countPendingIdentityDocumentReviews = async () => {
  const profile = await requireTenantAdmin();

  const rows = await db
    .select({ id: identityDocuments.id })
    .from(identityDocuments)
    .where(
      and(
        eq(identityDocuments.tenantId, profile.tenantId),
        eq(identityDocuments.verificationStatus, "pending_review"),
      ),
    );

  return rows.length;
};

const EXPIRING_SOON_WINDOW_DAYS = 30;

/** Tenant Admin-facing: every identity document on file (any status), for the compliance dashboard. */
export const listAllIdentityDocuments = async (filters: { type?: string; status?: string; sort?: "asc" | "desc" }) => {
  const profile = await requireTenantAdmin();

  const type = filters.type && isIdentityDocumentType(filters.type) ? filters.type : undefined;
  const status = filters.status && isVerificationStatus(filters.status) ? filters.status : undefined;

  return db
    .select({
      id: identityDocuments.id,
      type: identityDocuments.type,
      documentNumber: identityDocuments.documentNumber,
      issuingCountry: identityDocuments.issuingCountry,
      issueDate: identityDocuments.issueDate,
      expiryDate: identityDocuments.expiryDate,
      verificationStatus: identityDocuments.verificationStatus,
      createdAt: identityDocuments.createdAt,
      employeeName: employees.fullName,
    })
    .from(identityDocuments)
    .innerJoin(employees, eq(identityDocuments.employeeId, employees.id))
    .where(
      and(
        eq(identityDocuments.tenantId, profile.tenantId),
        isNull(identityDocuments.deletedAt),
        type ? eq(identityDocuments.type, type) : undefined,
        status ? eq(identityDocuments.verificationStatus, status) : undefined,
      ),
    )
    .orderBy(
      filters.sort === "desc" ? desc(identityDocuments.expiryDate) : asc(identityDocuments.expiryDate),
    );
};

/** Powers the dashboard sidebar's "Compliance" badge — documents expiring within 30 days, not already rejected. */
export const countExpiringIdentityDocuments = async () => {
  const profile = await requireTenantAdmin();

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() + EXPIRING_SOON_WINDOW_DAYS);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  const rows = await db
    .select({ id: identityDocuments.id })
    .from(identityDocuments)
    .where(
      and(
        eq(identityDocuments.tenantId, profile.tenantId),
        isNull(identityDocuments.deletedAt),
        ne(identityDocuments.verificationStatus, "rejected"),
        isNotNull(identityDocuments.expiryDate),
        lte(identityDocuments.expiryDate, cutoffDate),
      ),
    );

  return rows.length;
};

/** CSV export for the compliance dashboard — built server-side, downloaded client-side as a Blob. */
export const exportIdentityDocumentsCsv = async () => {
  const rows = await listAllIdentityDocuments({});

  const header = ["Employee", "Type", "Document number", "Issuing country", "Issue date", "Expiry date", "Status"];
  const lines = rows.map((row) => [
    row.employeeName,
    IDENTITY_DOCUMENT_TYPE_LABELS[row.type],
    row.documentNumber ?? "",
    row.issuingCountry ?? "",
    row.issueDate ?? "",
    row.expiryDate ?? "",
    row.verificationStatus,
  ]);

  return toCsv(header, lines);
};

/** Tenant Admin-facing signed URL for reviewing one of their tenant's uploads. */
export const getIdentityDocumentReviewUrl = async (id: string) => {
  const profile = await requireTenantAdmin();

  const [doc] = await db
    .select({ fileRef: identityDocuments.fileRef })
    .from(identityDocuments)
    .where(and(eq(identityDocuments.id, id), eq(identityDocuments.tenantId, profile.tenantId)))
    .limit(1);

  if (!doc) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.fileRef, 60 * 10);
  return error ? null : data.signedUrl;
};

const getReviewableDocument = async (id: string, tenantId: string) => {
  const [doc] = await db
    .select()
    .from(identityDocuments)
    .where(
      and(
        eq(identityDocuments.id, id),
        eq(identityDocuments.tenantId, tenantId),
        eq(identityDocuments.verificationStatus, "pending_review"),
      ),
    )
    .limit(1);

  return doc ?? null;
};

export const verifyIdentityDocument = async (id: string): Promise<IdentityDocumentActionResult> => {
  const profile = await requireTenantAdmin();
  const doc = await getReviewableDocument(id, profile.tenantId);
  if (!doc) return { success: false, error: "Document not found." };

  await db
    .update(identityDocuments)
    .set({ verificationStatus: "verified", reviewedBy: profile.id, reviewedAt: new Date(), updatedAt: new Date() })
    .where(eq(identityDocuments.id, id));

  await logAuditEvent({
    action: "identity_document.verified",
    actorEmail: profile.email,
    tenantId: profile.tenantId,
    metadata: { identityDocumentId: id },
  });

  revalidatePath("/dashboard/identity-documents");
  return { success: true };
};

/** Tenant Admin-facing: every identity document on file for one employee (any status), newest first — powers the employee detail page's "Identity documents" tab, where verified/rejected uploads are still reviewable after the fact. */
export const listIdentityDocumentsForEmployee = async (employeeId: string) => {
  const profile = await requireTenantAdmin();

  return db
    .select()
    .from(identityDocuments)
    .where(
      and(
        eq(identityDocuments.employeeId, employeeId),
        eq(identityDocuments.tenantId, profile.tenantId),
        isNull(identityDocuments.deletedAt),
      ),
    )
    .orderBy(desc(identityDocuments.createdAt));
};

export const deleteIdentityDocument = async (id: string): Promise<IdentityDocumentActionResult> => {
  const profile = await requireTenantAdmin();

  const [doc] = await db
    .select({ id: identityDocuments.id, employeeId: identityDocuments.employeeId })
    .from(identityDocuments)
    .where(and(eq(identityDocuments.id, id), eq(identityDocuments.tenantId, profile.tenantId)))
    .limit(1);

  if (!doc) return { success: false, error: "Document not found." };

  await db.update(identityDocuments).set({ deletedAt: new Date() }).where(eq(identityDocuments.id, id));

  await logAuditEvent({
    action: "identity_document.deleted",
    actorEmail: profile.email,
    tenantId: profile.tenantId,
    metadata: { identityDocumentId: id, employeeId: doc.employeeId },
  });

  revalidatePath(`/dashboard/employees/${doc.employeeId}/documents`);
  revalidatePath("/dashboard/identity-documents");
  revalidatePath("/dashboard/compliance");
  return { success: true };
};

export const rejectIdentityDocument = async (
  id: string,
  values: unknown,
): Promise<IdentityDocumentActionResult> => {
  const profile = await requireTenantAdmin();
  const parsed = rejectIdentityDocumentSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "A reason is required." };
  }

  const doc = await getReviewableDocument(id, profile.tenantId);
  if (!doc) return { success: false, error: "Document not found." };

  await db
    .update(identityDocuments)
    .set({
      verificationStatus: "rejected",
      rejectionReason: parsed.data.reason,
      reviewedBy: profile.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(identityDocuments.id, id));

  await logAuditEvent({
    action: "identity_document.rejected",
    actorEmail: profile.email,
    tenantId: profile.tenantId,
    metadata: { identityDocumentId: id, reason: parsed.data.reason },
  });

  revalidatePath("/dashboard/identity-documents");
  return { success: true };
};
