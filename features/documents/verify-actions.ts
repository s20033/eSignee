"use server";

/** Public verification lookup — no auth, and deliberately returns no PII beyond a title and dates. */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, profiles, signatures } from "@/drizzle/schema";

export const getVerificationInfo = async (documentId: string) => {
  const [row] = await db
    .select({
      title: documents.title,
      status: documents.status,
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

  return { ...row, signatureDates: signatureRows.map((s) => s.signedAt) };
};
