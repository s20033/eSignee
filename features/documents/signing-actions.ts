"use server";

/**
 * Public, token-authenticated actions for the no-login signing flow (PROJECT.md:
 * "Employee: receive secure link... No login required" — also used by external
 * signees, see features/signees). Deliberately kept separate from actions.ts,
 * which requires an authenticated employer session — nothing here should call
 * getCurrentProfile().
 *
 * A signing token identifies a "session": every document generated in one
 * batch that needs the counterparty's signature shares the same token, so
 * these actions always operate on the *list* of documents behind a token, even
 * when that list has exactly one entry (e.g. a Contract Builder annex).
 */
import { headers } from "next/headers";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, employees, profiles, signatures, signees } from "@/drizzle/schema";
import { createServiceClient } from "@/lib/supabase/service";
import { applySignatureMarks, applySignatureToDocument } from "@/lib/pdf/apply-signature";
import { embedVerificationQr } from "@/lib/pdf/embed-verification-qr";
import type { SignatureBlockLayout } from "@/lib/pdf/chrome";
import { getAppOrigin } from "@/lib/get-app-origin";
import { sendEmail } from "@/lib/email/send";
import { documentCompletedEmail, employerSignatureNeededEmail } from "@/lib/email/templates";
import { logAuditEvent } from "@/lib/audit/log";
import { recordDocumentVersion } from "@/lib/documents/document-service";
import { resolveDocumentParty } from "@/lib/documents/resolve-party";
import { counterpartyConsentText } from "@/lib/documents/consent-text";

const DOCUMENTS_BUCKET = "documents";
const SIGNATURES_BUCKET = "signatures";

/** Every document sharing this token, still waiting on the counterparty's signature. */
export const getSigningSession = async (token: string) => {
  const rows = await db
    .select({
      document: documents,
      partyName: sql<string>`coalesce(${employees.fullName}, ${signees.fullName})`,
      companyName: profiles.companyName,
    })
    .from(documents)
    .leftJoin(employees, eq(documents.employeeId, employees.id))
    .leftJoin(signees, eq(documents.signeeId, signees.id))
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

/** Logs a single "viewed" event when the signee opens their signing link. */
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

/** Applies one drawn signature to every document in the session — the signee signs once for the whole batch. */
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
  const { employeeId, signeeId, employerId } = session[0].document;
  // documents_party_check guarantees exactly one of these is set.
  const partyId = employeeId ?? signeeId;
  const party = await resolveDocumentParty({ employeeId, signeeId });

  const headerList = await headers();
  const ipAddress = headerList.get("x-forwarded-for");
  const userAgent = headerList.get("user-agent");
  const signedAt = new Date();
  const origin = await getAppOrigin();

  const signatureImagePath = `${employerId}/${partyId}/${token}-employee.png`;
  const signatureBase64 = signatureDataUrl.split(",")[1] ?? "";
  await supabase.storage
    .from(SIGNATURES_BUCKET)
    .upload(signatureImagePath, Buffer.from(signatureBase64, "base64"), { contentType: "image/png" });

  const companyName = session[0].companyName;

  for (const { document, partyName } of session) {
    await logAuditEvent({
      action: "document.consent_accepted",
      actorEmail: party?.email ?? null,
      documentId: document.id,
    });

    const { data: pdfData, error: downloadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .download(document.pdfUrl!);

    if (downloadError || !pdfData) {
      return { success: false, error: `Could not load "${document.title}" to sign.` };
    }

    const pdfBytes = new Uint8Array(await pdfData.arrayBuffer());
    const isTwoParty = document.signatureType === "two-party";

    let signedPdfBytes: Uint8Array;
    if (isTwoParty) {
      // The employer/sender signs second and appends the (single, combined)
      // certificate page then — see signAsEmployer. No QR yet either.
      signedPdfBytes = await applySignatureMarks(pdfBytes, {
        role: "employee",
        layout: document.signatureLayout as SignatureBlockLayout | null,
        signatureDataUrl,
      });
    } else {
      const withCert = await applySignatureToDocument(pdfBytes, {
        role: "employee",
        layout: document.signatureLayout as SignatureBlockLayout | null,
        documentId: document.id,
        signerLabel: document.counterpartyRoleLabel ?? "Pracownik / Zleceniobiorca",
        signerName: partyName,
        signerEmail: party?.email ?? "unknown",
        signatureDataUrl,
        consentText: counterpartyConsentText(companyName),
        signedAt,
        ipAddress,
        userAgent,
        documentTitle: document.title,
        sha256Hash: document.sha256Hash,
      });
      signedPdfBytes = await embedVerificationQr(withCert, `${origin}/verify/${document.id}`);
    }

    const finalPath = `${document.employerId}/${partyId}/${document.bundleId}/${document.kind ?? document.id}-employee-signed.pdf`;

    await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(finalPath, Buffer.from(signedPdfBytes), { contentType: "application/pdf" });

    await db.insert(signatures).values({
      documentId: document.id,
      signerEmail: party?.email ?? "unknown",
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
      actorEmail: party?.email ?? null,
      documentId: document.id,
      metadata: { ipAddress },
    });
    if (!isTwoParty) {
      await logAuditEvent({
        action: "document.completed",
        actorEmail: party?.email ?? null,
        documentId: document.id,
      });
    }

    await recordDocumentVersion({
      documentId: document.id,
      pdfBytes: signedPdfBytes,
      pdfUrl: finalPath,
      note: isTwoParty ? "Employee signed" : "Employee signed — completed",
      actorEmail: party?.email ?? null,
    });

    if (isTwoParty) {
      const [employer] = await db.select().from(profiles).where(eq(profiles.id, document.employerId)).limit(1);

      if (employer?.email && employer.notifyOnSignatureNeeded) {
        await sendEmail({
          to: employer.email,
          subject: `${document.title}: ready for your signature`,
          html: employerSignatureNeededEmail({
            documentTitle: document.title,
            employeeName: partyName,
            dashboardUrl: `${origin}/dashboard/documents/${document.id}`,
          }),
        });
      }
    } else if (party?.email) {
      await sendEmail({
        to: party.email,
        subject: `${document.title} — completed`,
        html: documentCompletedEmail({ documentTitle: document.title, recipientName: partyName }),
      });
    }
  }

  return { success: true };
};
