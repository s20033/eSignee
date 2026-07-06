"use server";

/**
 * Public, token-authenticated actions for the no-login employee signing flow
 * (PROJECT.md: "Employee: receive secure link... No login required").
 * Deliberately kept separate from actions.ts, which requires an authenticated
 * employer session — nothing here should call getCurrentProfile().
 */
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, employees, profiles, signatures } from "@/drizzle/schema";
import { createServiceClient } from "@/lib/supabase/service";
import { applySignatureToDocument } from "@/lib/pdf/apply-signature";
import { embedVerificationQr } from "@/lib/pdf/embed-verification-qr";
import type { SignatureBlockLayout } from "@/lib/pdf/chrome";
import { getAppOrigin } from "@/lib/get-app-origin";
import { sendEmail } from "@/lib/email/send";
import { documentCompletedEmail, employerSignatureNeededEmail } from "@/lib/email/templates";
import { logAuditEvent } from "@/lib/audit/log";

const DOCUMENTS_BUCKET = "documents";
const SIGNATURES_BUCKET = "signatures";

export const getDocumentBySigningToken = async (token: string) => {
  const [row] = await db
    .select({
      document: documents,
      employeeName: employees.fullName,
      companyName: profiles.companyName,
    })
    .from(documents)
    .innerJoin(employees, eq(documents.employeeId, employees.id))
    .innerJoin(profiles, eq(documents.employerId, profiles.id))
    .where(and(eq(documents.signingToken, token), eq(documents.status, "waiting")))
    .limit(1);

  return row ?? null;
};

export const getSigningDocumentPreviewUrl = async (token: string) => {
  const row = await getDocumentBySigningToken(token);
  if (!row?.document.pdfUrl) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(row.document.pdfUrl, 60 * 10);

  return error ? null : data.signedUrl;
};

export type SubmitSignatureResult = { success: true } | { success: false; error: string };

export const submitEmployeeSignature = async (
  token: string,
  signatureDataUrl: string,
  consentGiven: boolean,
): Promise<SubmitSignatureResult> => {
  if (!consentGiven) {
    return { success: false, error: "Consent to data processing is required to sign." };
  }
  if (!signatureDataUrl) {
    return { success: false, error: "A signature is required." };
  }

  const row = await getDocumentBySigningToken(token);
  if (!row) {
    return { success: false, error: "This signing link is invalid or has already been used." };
  }

  const { document } = row;
  const supabase = createServiceClient();

  const { data: pdfData, error: downloadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(document.pdfUrl!);

  if (downloadError || !pdfData) {
    return { success: false, error: "Could not load the document to sign." };
  }

  const ipAddress = (await headers()).get("x-forwarded-for");
  const signedAt = new Date();

  const signedPdfBytes = await applySignatureToDocument(new Uint8Array(await pdfData.arrayBuffer()), {
    role: "employee",
    layout: document.signatureLayout as SignatureBlockLayout | null,
    signerLabel: "Pracownik / Zleceniobiorca",
    signerName: row.employeeName,
    signatureDataUrl,
    consentText:
      "Podpisujący potwierdza zapoznanie się z treścią dokumentu oraz wyraża zgodę na przetwarzanie danych osobowych w zakresie niezbędnym do jego realizacji.",
    signedAt,
    ipAddress,
  });

  const signatureImagePath = `${document.employerId}/${document.employeeId}/${document.id}-employee.png`;
  const signatureBase64 = signatureDataUrl.split(",")[1] ?? "";
  await supabase.storage
    .from(SIGNATURES_BUCKET)
    .upload(signatureImagePath, Buffer.from(signatureBase64, "base64"), { contentType: "image/png" });

  const isTwoParty = document.signatureType === "two-party";
  const finalPath = `${document.employerId}/${document.employeeId}/${document.bundleId}/${document.kind}-employee-signed.pdf`;

  const pdfToStore = isTwoParty
    ? signedPdfBytes
    : await embedVerificationQr(signedPdfBytes, `${await getAppOrigin()}/verify/${document.id}`);

  await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(finalPath, Buffer.from(pdfToStore), { contentType: "application/pdf" });

  const [employee] = await db.select().from(employees).where(eq(employees.id, document.employeeId)).limit(1);

  await db.insert(signatures).values({
    documentId: document.id,
    signerEmail: employee?.email ?? "unknown",
    imageUrl: signatureImagePath,
    ipAddress,
  });

  await db
    .update(documents)
    .set({
      status: isTwoParty ? "employee_signed" : "completed",
      pdfUrl: finalPath,
      finalPdfUrl: isTwoParty ? null : finalPath,
      signingToken: null,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, document.id));

  await logAuditEvent({
    action: "document.signed_by_employee",
    actorEmail: employee?.email ?? null,
    documentId: document.id,
    metadata: { ipAddress },
  });
  if (!isTwoParty) {
    await logAuditEvent({
      action: "document.completed",
      actorEmail: employee?.email ?? null,
      documentId: document.id,
    });
  }

  if (isTwoParty) {
    const [employer] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, document.employerId))
      .limit(1);

    if (employer?.email && employer.notifyOnSignatureNeeded) {
      const origin = await getAppOrigin();
      await sendEmail({
        to: employer.email,
        subject: `${document.title}: ready for your signature`,
        html: employerSignatureNeededEmail({
          documentTitle: document.title,
          employeeName: row.employeeName,
          dashboardUrl: `${origin}/dashboard/employees/${document.employeeId}/documents`,
        }),
      });
    }
  } else if (employee?.email) {
    await sendEmail({
      to: employee.email,
      subject: `${document.title} — completed`,
      html: documentCompletedEmail({ documentTitle: document.title, recipientName: employee.fullName }),
    });
  }

  return { success: true };
};
