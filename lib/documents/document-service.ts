import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, documentVersions } from "@/drizzle/schema";
import { sha256Hex } from "@/lib/pdf/hash";

type RecordVersionInput = {
  documentId: string;
  /** Bytes of the PDF already uploaded at pdfUrl — hashed here, not re-uploaded. */
  pdfBytes: Uint8Array;
  pdfUrl: string;
  note: string;
  actorEmail: string | null;
};

/**
 * Records an immutable snapshot of a document's current PDF as a new version.
 * Never overwrites a prior version row — call this every time a document's PDF
 * changes (generated, employee signed, employer signed, completed).
 */
export const recordDocumentVersion = async ({
  documentId,
  pdfBytes,
  pdfUrl,
  note,
  actorEmail,
}: RecordVersionInput) => {
  const [existing] = await db
    .select({ currentVersion: documents.currentVersion })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  const versionNumber = (existing?.currentVersion ?? 0) + 1;
  const sha256Hash = sha256Hex(pdfBytes);

  await db.insert(documentVersions).values({
    documentId,
    versionNumber,
    pdfUrl,
    sha256Hash,
    note,
    actorEmail,
  });

  await db
    .update(documents)
    .set({ currentVersion: versionNumber, sha256Hash })
    .where(eq(documents.id, documentId));

  return { versionNumber, sha256Hash };
};

export const listDocumentVersions = async (documentId: string) =>
  db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.documentId, documentId))
    .orderBy(desc(documentVersions.versionNumber));
