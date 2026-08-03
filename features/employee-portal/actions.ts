"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents } from "@/drizzle/schema";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPortalUser } from "@/lib/auth/get-current-portal-user";

const DOCUMENTS_BUCKET = "documents";

/** Every document the employer has generated for the signed-in employee, newest first, grouped by bundle. */
export const listMyDocumentBundles = async () => {
  const { employee } = await getCurrentPortalUser();

  const rows = await db
    .select()
    .from(documents)
    .where(eq(documents.employeeId, employee.id))
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

/** Signed download URL for one of the employee's own documents — null if it doesn't belong to them. */
export const getMyDocumentDownloadUrl = async (documentId: string) => {
  const { employee } = await getCurrentPortalUser();

  const [document] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.employeeId, employee.id)))
    .limit(1);

  if (!document?.pdfUrl) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(document.pdfUrl, 60 * 10);

  return error ? null : data.signedUrl;
};
