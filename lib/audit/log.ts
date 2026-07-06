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
