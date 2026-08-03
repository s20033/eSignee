"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, profiles } from "@/drizzle/schema";
import { getCurrentPortalUser } from "@/lib/auth/get-current-portal-user";
import { createServiceClient } from "@/lib/supabase/service";
import { getAppOrigin } from "@/lib/get-app-origin";
import { sendEmail } from "@/lib/email/send";
import { documentUploadedForSignatureEmail } from "@/lib/email/templates";
import { logAuditEvent } from "@/lib/audit/log";
import { recordDocumentVersion } from "@/lib/documents/document-service";
import { MAX_UPLOAD_SIZE_BYTES, uploadDocumentForSignatureSchema } from "./schema";

const DOCUMENTS_BUCKET = "documents";

export type DocumentUploadResult = { success: true } | { success: false; error: string };

/**
 * Employee-initiated: uploads an external document (already-signed-by-them
 * form, etc.) that needs the employer's signature. Stored in the same
 * "documents" bucket path convention as employer-generated documents
 * ({employerId}/{employeeId}/{bundleId}/{documentId}.pdf), but the employee's
 * own session has no Storage RLS access to that path — same situation
 * features/documents/signing-actions.ts already solves for the no-login
 * signing flow, so this uses the service-role client for the same reason
 * ("trusted server-only code path").
 *
 * Lands directly in the employer's existing Documents list/signing queue —
 * signAsEmployer and SignAsEmployerDialog need no changes, since a
 * signatureType: "employer", status: "draft" document is exactly what they
 * already know how to sign, with or without a pre-computed signatureLayout.
 */
export const uploadDocumentForSignature = async (formData: FormData): Promise<DocumentUploadResult> => {
  const { profile, employee } = await getCurrentPortalUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Choose a file to upload." };
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return { success: false, error: "File must be 2 MB or smaller." };
  }

  const parsed = uploadDocumentForSignatureSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const bundleId = randomUUID();
  const documentId = randomUUID();
  const storagePath = `${employee.employerId}/${employee.id}/${bundleId}/${documentId}.pdf`;
  const fileBytes = new Uint8Array(await file.arrayBuffer());

  const supabase = createServiceClient();
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, Buffer.from(fileBytes), { contentType: "application/pdf" });

  if (uploadError) {
    return { success: false, error: `Upload failed: ${uploadError.message}` };
  }

  await db.insert(documents).values({
    id: documentId,
    employerId: employee.employerId,
    tenantId: employee.tenantId,
    employeeId: employee.id,
    templateId: null,
    title: parsed.data.title,
    kind: "employee_uploaded",
    bundleId,
    signatureType: "employer",
    status: "draft",
    pdfUrl: storagePath,
  });

  await recordDocumentVersion({
    documentId,
    pdfBytes: fileBytes,
    pdfUrl: storagePath,
    note: "Uploaded by employee",
    actorEmail: profile.email,
  });

  await logAuditEvent({
    action: "document.uploaded_by_employee",
    actorEmail: profile.email,
    tenantId: employee.tenantId,
    documentId,
    metadata: { title: parsed.data.title },
  });

  const [admin] = await db
    .select({ email: profiles.email })
    .from(profiles)
    .where(eq(profiles.id, employee.employerId))
    .limit(1);

  if (admin) {
    const origin = await getAppOrigin();
    await sendEmail({
      to: admin.email,
      subject: `${employee.fullName} uploaded a document for your signature`,
      html: documentUploadedForSignatureEmail({
        employeeName: employee.fullName,
        documentTitle: parsed.data.title,
        dashboardUrl: `${origin}/dashboard/documents/${documentId}`,
      }),
    });
  }

  revalidatePath("/portal/documents");
  return { success: true };
};
