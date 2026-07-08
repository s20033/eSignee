import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs } from "@/drizzle/schema";

type LogAuditEventInput = {
  action: string;
  actorEmail: string | null;
  documentId?: string | null;
  metadata?: Record<string, unknown>;
};

/** Records one audit trail entry. Never throws — a logging failure shouldn't fail the action it's recording. */
export const logAuditEvent = async ({
  action,
  actorEmail,
  documentId,
  metadata,
}: LogAuditEventInput) => {
  try {
    await db.insert(auditLogs).values({
      documentId: documentId ?? null,
      actorEmail,
      action,
      metadata: metadata ?? null,
    });
  } catch (error) {
    console.error(`Failed to write audit log for action "${action}":`, error);
  }
};

/** Full event history for one document, newest first — powers the Timeline and Audit Report tabs. */
export const listDocumentTimeline = async (documentId: string) =>
  db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.documentId, documentId))
    .orderBy(desc(auditLogs.createdAt));

export const countDocumentVerifications = async (documentId: string) => {
  const [row] = await db
    .select({ total: count() })
    .from(auditLogs)
    .where(and(eq(auditLogs.documentId, documentId), eq(auditLogs.action, "document.verified")));

  return row?.total ?? 0;
};
