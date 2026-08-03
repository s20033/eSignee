"use server";

import { and, asc, count, desc, eq, isNotNull, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, documents, employees, templates } from "@/drizzle/schema";
import { requireTenantAdmin } from "@/lib/auth/get-current-profile";

const DOCUMENT_STATUSES = ["draft", "waiting", "employee_signed", "completed", "archived"] as const;

export const getDashboardStats = async () => {
  const profile = await requireTenantAdmin();

  const [[employeeCount], [templateCount], statusCounts, recentActivity] = await Promise.all([
    db
      .select({ count: count() })
      .from(employees)
      .where(and(eq(employees.employerId, profile.id), isNull(employees.deletedAt))),
    db
      .select({ count: count() })
      .from(templates)
      .where(and(eq(templates.employerId, profile.id), isNull(templates.deletedAt))),
    db
      .select({ status: documents.status, count: count() })
      .from(documents)
      .where(eq(documents.employerId, profile.id))
      .groupBy(documents.status),
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
      .innerJoin(documents, eq(auditLogs.documentId, documents.id))
      .where(eq(documents.employerId, profile.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(10),
  ]);

  const documentsByStatus = Object.fromEntries(
    DOCUMENT_STATUSES.map((status) => [
      status,
      statusCounts.find((row) => row.status === status)?.count ?? 0,
    ]),
  ) as Record<(typeof DOCUMENT_STATUSES)[number], number>;

  return {
    employeeCount: employeeCount.count,
    templateCount: templateCount.count,
    documentsByStatus,
    recentActivity,
  };
};

/** Contracts with a known end date, soonest first — powers the dashboard's expiration tracker. */
export const getUpcomingContractExpirations = async () => {
  const profile = await requireTenantAdmin();

  const rows = await db
    .select({
      documentId: documents.id,
      title: documents.title,
      expiresAt: documents.expiresAt,
      employeeId: employees.id,
      employeeName: employees.fullName,
    })
    .from(documents)
    .innerJoin(employees, eq(documents.employeeId, employees.id))
    .where(
      and(
        eq(documents.employerId, profile.id),
        isNotNull(documents.expiresAt),
        ne(documents.status, "archived"),
        isNull(employees.deletedAt),
      ),
    )
    .orderBy(asc(documents.expiresAt))
    .limit(10);

  // The isNotNull filter above guarantees expiresAt is set; narrow the type to match.
  return rows.map((row) => ({ ...row, expiresAt: row.expiresAt as string }));
};

/** Documents generated per month, zero-filled, oldest first — powers the dashboard's monthly trend chart. */
export const getMonthlyDocumentCounts = async (monthsBack = 6) => {
  const profile = await requireTenantAdmin();

  const rows = await db
    .select({
      month: sql<string>`to_char(${documents.createdAt}, 'YYYY-MM')`,
      count: count(),
    })
    .from(documents)
    .where(eq(documents.employerId, profile.id))
    .groupBy(sql`to_char(${documents.createdAt}, 'YYYY-MM')`);

  const countsByMonth = new Map(rows.map((row) => [row.month, row.count]));

  const now = new Date();
  return Array.from({ length: monthsBack }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { month, count: countsByMonth.get(month) ?? 0 };
  });
};
