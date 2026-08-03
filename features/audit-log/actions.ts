"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs } from "@/drizzle/schema";
import { requireTenantAdmin } from "@/lib/auth/get-current-profile";
import { listTenantAuditLog, listTenantAuditLogInRange, logAuditEvent } from "@/lib/audit/log";
import { ACTION_LABELS } from "@/lib/audit/action-labels";
import { toCsv } from "@/lib/csv";

export const listAuditLogPage = async (page: number) => {
  const profile = await requireTenantAdmin();
  return listTenantAuditLog(profile.tenantId, page);
};

const MONTH_FORMAT = /^\d{4}-\d{2}$/;

/** CSV export of one calendar month's tenant-wide audit trail — built server-side, downloaded client-side as a Blob. `month` is "YYYY-MM". */
export const exportAuditLogMonthCsv = async (month: string) => {
  if (!MONTH_FORMAT.test(month)) {
    throw new Error("Invalid month");
  }

  const profile = await requireTenantAdmin();
  const [year, monthIndex] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 1));

  const rows = await listTenantAuditLogInRange(profile.tenantId, start, end);

  const header = ["Event", "Document", "Actor", "When"];
  const lines = rows.map((row) => [
    ACTION_LABELS[row.action] ?? row.action,
    row.documentTitle ?? "",
    row.actorEmail ?? "System",
    row.createdAt.toISOString(),
  ]);

  return toCsv(header, lines);
};

export type AuditLogMutationResult = { success: true } | { success: false; error: string };

/** Permanently deletes the selected audit log entries — a retention/cleanup tool, meant to be used after exporting an archival copy. Re-derives tenant ownership from the DB rather than trusting the client-supplied id list, and records its own irreversible action as a fresh audit entry. */
export const bulkDeleteAuditLogs = async (ids: string[]): Promise<AuditLogMutationResult> => {
  const profile = await requireTenantAdmin();
  if (ids.length === 0) return { success: true };

  const owned = await db
    .select({ id: auditLogs.id })
    .from(auditLogs)
    .where(and(inArray(auditLogs.id, ids), eq(auditLogs.tenantId, profile.tenantId)));

  if (owned.length === 0) return { success: false, error: "No matching entries found" };

  const ownedIds = owned.map((row) => row.id);
  await db.delete(auditLogs).where(inArray(auditLogs.id, ownedIds));

  await logAuditEvent({
    action: "audit_log.purged",
    actorEmail: profile.email,
    tenantId: profile.tenantId,
    metadata: { count: ownedIds.length },
  });

  revalidatePath("/dashboard/audit-log");
  return { success: true };
};
