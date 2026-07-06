"use server";

import { and, asc, count, desc, eq, isNotNull, isNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, documents, employees, templates } from "@/drizzle/schema";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

const DOCUMENT_STATUSES = ["draft", "waiting", "employee_signed", "completed", "archived"] as const;

export const getDashboardStats = async () => {
  const profile = await getCurrentProfile();

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
  const profile = await getCurrentProfile();

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
      ),
    )
    .orderBy(asc(documents.expiresAt))
    .limit(10);

  // The isNotNull filter above guarantees expiresAt is set; narrow the type to match.
  return rows.map((row) => ({ ...row, expiresAt: row.expiresAt as string }));
};
