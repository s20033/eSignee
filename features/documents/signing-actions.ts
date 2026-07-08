"use server";

/**
 * Public, token-authenticated actions for the no-login employee signing flow
 * (PROJECT.md: "Employee: receive secure link... No login required").
 * Deliberately kept separate from actions.ts, which requires an authenticated
 * employer session — nothing here should call getCurrentProfile().
 *
 * A signing token identifies a "session": every document generated in one
 * batch that needs an employee signature shares the same token, so these
 * actions always operate on the *list* of documents behind a token, even
 * when that list has exactly one entry (e.g. a Contract Builder annex).
 */
import { headers } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
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
import { recordDocumentVersion } from "@/lib/documents/document-service";

const DOCUMENTS_BUCKET = "documents";
const SIGNATURES_BUCKET = "signatures";

/** Every document sharing this token, still waiting on the employee's signature. */
export const getSigningSession = async (token: string) => {
  const rows = await db
    .select({
      document: documents,
      employeeName: employees.fullName,
      companyName: profiles.companyName,
    })
    .from(documents)
    .innerJoin(employees, eq(documents.employeeId, employees.id))
    .innerJoin(profiles, eq(documents.employerId, profiles.id))
    .where(
      and(
        eq(documents.signingToken, token),
        eq(documents.status, "waiting"),
        isNull(documents.deletedAt),
      ),
    )
    .orderBy(documents.createdAt);

  return rows;
};

/** Logs a single "viewed" event when the employee opens their signing link. */
export const logDocumentViewed = async (documentId: string) => {
  await logAuditEvent({ action: "document.viewed", actorEmail: null, documentId });
};

/** One signed preview URL per document in the session. */
export const getSigningSessionPreviewUrls = async (token: string) => {
  const session = await getSigningSession(token);
  const supabase = createServiceClient();

  const urls = await Promise.all(
    session.map(async ({ document }) => {
      if (!document.pdfUrl) return { documentId: document.id, title: document.title, previewUrl: null };
      const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(document.pdfUrl, 60 * 10);
      return { documentId: document.id, title: document.title, previewUrl: error ? null : data.signedUrl };
    }),
  );

  return urls;
};

export type SubmitSignatureResult = { success: true } | { success: false; error: string };

/** Applies one drawn signature to every document in the session — the employee signs once for the whole batch. */
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

  const session = await getSigningSession(token);
  if (session.length === 0) {
    return { success: false, error: "This signing link is invalid or has already been used." };
  }

  const supabase = createServiceClient();
  const { employeeId, employerId } = session[0].document;
  const [employee] = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);

  const headerList = await headers();
  const ipAddress = headerList.get("x-forwarded-for");
  const userAgent = headerList.get("user-agent");
  const signedAt = new Date();
  const origin = await getAppOrigin();

  const signatureImagePath = `${employerId}/${employeeId}/${token}-employee.png`;
  const signatureBase64 = signatureDataUrl.split(",")[1] ?? "";
  await supabase.storage
    .from(SIGNATURES_BUCKET)
    .upload(signatureImagePath, Buffer.from(signatureBase64, "base64"), { contentType: "image/png" });

  for (const { document, employeeName } of session) {
    await logAuditEvent({
      action: "document.consent_accepted",
      actorEmail: employee?.email ?? null,
      documentId: document.id,
    });

    const { data: pdfData, error: downloadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .download(document.pdfUrl!);

    if (downloadError || !pdfData) {
      return { success: false, error: `Could not load "${document.title}" to sign.` };
    }

    const signedPdfBytes = await applySignatureToDocument(new Uint8Array(await pdfData.arrayBuffer()), {
      role: "employee",
      layout: document.signatureLayout as SignatureBlockLayout | null,
      signerLabel: "Pracownik / Zleceniobiorca",
      signerName: employeeName,
      signatureDataUrl,
      consentText:
        "Podpisujący potwierdza zapoznanie się z treścią dokumentu oraz wyraża zgodę na przetwarzanie danych osobowych w zakresie niezbędnym do jego realizacji.",
      signedAt,
      ipAddress,
    });

    const isTwoParty = document.signatureType === "two-party";
    const finalPath = `${document.employerId}/${document.employeeId}/${document.bundleId}/${document.kind ?? document.id}-employee-signed.pdf`;

    const pdfToStore = isTwoParty
      ? signedPdfBytes
      : await embedVerificationQr(signedPdfBytes, `${origin}/verify/${document.id}`);

    await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(finalPath, Buffer.from(pdfToStore), { contentType: "application/pdf" });

    await db.insert(signatures).values({
      documentId: document.id,
      signerEmail: employee?.email ?? "unknown",
      imageUrl: signatureImagePath,
      ipAddress,
      userAgent,
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

    await recordDocumentVersion({
      documentId: document.id,
      pdfBytes: pdfToStore,
      pdfUrl: finalPath,
      note: isTwoParty ? "Employee signed" : "Employee signed — completed",
      actorEmail: employee?.email ?? null,
    });

    if (isTwoParty) {
      const [employer] = await db.select().from(profiles).where(eq(profiles.id, document.employerId)).limit(1);

      if (employer?.email && employer.notifyOnSignatureNeeded) {
        await sendEmail({
          to: employer.email,
          subject: `${document.title}: ready for your signature`,
          html: employerSignatureNeededEmail({
            documentTitle: document.title,
            employeeName,
            dashboardUrl: `${origin}/dashboard/documents/${document.id}`,
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
  }

  return { success: true };
};
