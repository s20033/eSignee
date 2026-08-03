import { and, count, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, documents } from "@/drizzle/schema";

const AUDIT_LOG_PAGE_SIZE = 20;

type LogAuditEventInput = {
  action: string;
  actorEmail: string | null;
  documentId?: string | null;
  // Only required for events with no documentId (e.g. employee/template
  // CRUD) — document-linked events derive it from the document itself, so
  // the many call sites that already have documentId don't need to look up
  // and pass it separately.
  tenantId?: string | null;
  metadata?: Record<string, unknown>;
};

/** Records one audit trail entry. Never throws — a logging failure shouldn't fail the action it's recording. */
export const logAuditEvent = async ({
  action,
  actorEmail,
  documentId,
  tenantId,
  metadata,
}: LogAuditEventInput) => {
  try {
    let resolvedTenantId = tenantId ?? null;

    if (!resolvedTenantId && documentId) {
      const [document] = await db
        .select({ tenantId: documents.tenantId })
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);
      resolvedTenantId = document?.tenantId ?? null;
    }

    await db.insert(auditLogs).values({
      tenantId: resolvedTenantId,
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

/**
 * Full tenant-wide event history, newest first, paginated — unlike
 * listDocumentTimeline (one document) or the dashboard's "Recent activity"
 * widget (document-linked events only, capped at 10), this includes every
 * event: account approvals, employee/template CRUD, identity document
 * review, signatory/invite-link changes, and expiry reminders.
 */
export const listTenantAuditLog = async (tenantId: string, page: number) => {
  const whereClause = eq(auditLogs.tenantId, tenantId);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        actorEmail: auditLogs.actorEmail,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        documentTitle: documents.title,
      })
      .from(auditLogs)
      .leftJoin(documents, eq(auditLogs.documentId, documents.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(AUDIT_LOG_PAGE_SIZE)
      .offset((page - 1) * AUDIT_LOG_PAGE_SIZE),
    db.select({ total: count() }).from(auditLogs).where(whereClause),
  ]);

  return { entries: rows, total, pageSize: AUDIT_LOG_PAGE_SIZE };
};

/** Every tenant-wide event within [start, end), newest first, unpaginated — powers the audit log's monthly CSV export. */
export const listTenantAuditLogInRange = async (tenantId: string, start: Date, end: Date) =>
  db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      actorEmail: auditLogs.actorEmail,
      createdAt: auditLogs.createdAt,
      documentTitle: documents.title,
    })
    .from(auditLogs)
    .leftJoin(documents, eq(auditLogs.documentId, documents.id))
    .where(and(eq(auditLogs.tenantId, tenantId), gte(auditLogs.createdAt, start), lt(auditLogs.createdAt, end)))
    .orderBy(desc(auditLogs.createdAt));

export const countDocumentVerifications = async (documentId: string) => {
  const [row] = await db
    .select({ total: count() })
    .from(auditLogs)
    .where(and(eq(auditLogs.documentId, documentId), eq(auditLogs.action, "document.verified")));

  return row?.total ?? 0;
};
