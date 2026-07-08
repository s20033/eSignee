import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, profiles, signatures } from "@/drizzle/schema";
import { logAuditEvent, countDocumentVerifications } from "@/lib/audit/log";
import { documentCategoryLabel } from "./category-labels";

/** Public verification lookup — no auth, and deliberately returns no PII beyond a title and dates. */
export const getVerificationInfo = async (documentId: string) => {
  const [row] = await db
    .select({
      title: documents.title,
      status: documents.status,
      category: documents.category,
      customCategoryLabel: documents.customCategoryLabel,
      currentVersion: documents.currentVersion,
      sha256Hash: documents.sha256Hash,
      createdAt: documents.createdAt,
      companyName: profiles.companyName,
    })
    .from(documents)
    .innerJoin(profiles, eq(documents.employerId, profiles.id))
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!row) return null;

  const signatureRows = await db
    .select({ signedAt: signatures.signedAt })
    .from(signatures)
    .where(eq(signatures.documentId, documentId));

  // Each successful lookup is itself a verification event.
  await logAuditEvent({ action: "document.verified", actorEmail: null, documentId });
  const verificationCount = await countDocumentVerifications(documentId);

  return {
    ...row,
    categoryLabel: documentCategoryLabel(row),
    signatureDates: signatureRows.map((s) => s.signedAt),
    verificationCount,
  };
};
