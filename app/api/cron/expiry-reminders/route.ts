import { NextResponse } from "next/server";
import { and, eq, isNotNull, isNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { employees, identityDocumentReminders, identityDocuments, profiles } from "@/drizzle/schema";
import { getAppOrigin } from "@/lib/get-app-origin";
import { sendEmail } from "@/lib/email/send";
import { identityDocumentExpiringAdminEmail, identityDocumentExpiringEmployeeEmail } from "@/lib/email/templates";
import { IDENTITY_DOCUMENT_TYPE_LABELS } from "@/features/identity-documents/schema";
import { logAuditEvent } from "@/lib/audit/log";

// Checked in this order — the first threshold that's due (daysUntilExpiry
// <= threshold) and hasn't already been sent wins, and only one reminder
// goes out per document per run. A missed run (cron down, etc.) still
// catches up correctly on the next run since the email copy always states
// the actual days remaining, not the threshold label.
const REMINDER_THRESHOLDS_DAYS = [90, 30, 7] as const;

const daysBetween = (from: Date, to: Date) => Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

/**
 * Daily sweep (see vercel.json) — no user session, runs across every
 * tenant. Trusted entry point gated by CRON_SECRET, same category as the
 * service-role Storage writes elsewhere in this app: a server-only path
 * that legitimately needs to act outside any single user's scope.
 *
 * Fails closed: an unset CRON_SECRET rejects every request rather than
 * skipping the check, since this route sends real email to real employees
 * and admins and must never be reachable by an unauthenticated caller.
 * Vercel injects the `Authorization: Bearer $CRON_SECRET` header
 * automatically on its own scheduled invocations once the env var is set on
 * the project (see vercel.json's crons entry).
 */
export const GET = async (request: Request) => {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const origin = await getAppOrigin();

  const candidates = await db
    .select({
      id: identityDocuments.id,
      type: identityDocuments.type,
      expiryDate: identityDocuments.expiryDate,
      tenantId: identityDocuments.tenantId,
      employeeFullName: employees.fullName,
      employeeEmail: employees.email,
      employerId: employees.employerId,
    })
    .from(identityDocuments)
    .innerJoin(employees, eq(identityDocuments.employeeId, employees.id))
    .where(
      and(
        isNull(identityDocuments.deletedAt),
        isNull(employees.deletedAt),
        ne(identityDocuments.verificationStatus, "rejected"),
        isNotNull(identityDocuments.expiryDate),
      ),
    );

  let remindersSent = 0;

  for (const doc of candidates) {
    if (!doc.expiryDate) continue;
    const daysUntilExpiry = daysBetween(today, new Date(doc.expiryDate));
    if (daysUntilExpiry < 0) continue;

    for (const threshold of REMINDER_THRESHOLDS_DAYS) {
      if (daysUntilExpiry > threshold) continue;

      const [alreadySent] = await db
        .select({ id: identityDocumentReminders.id })
        .from(identityDocumentReminders)
        .where(
          and(
            eq(identityDocumentReminders.identityDocumentId, doc.id),
            eq(identityDocumentReminders.intervalDays, threshold),
          ),
        )
        .limit(1);

      if (alreadySent) continue;

      const typeLabel = IDENTITY_DOCUMENT_TYPE_LABELS[doc.type];

      const [admin] = await db.select({ email: profiles.email }).from(profiles).where(eq(profiles.id, doc.employerId)).limit(1);
      if (admin) {
        await sendEmail({
          to: admin.email,
          subject: `${doc.employeeFullName}'s ${typeLabel} is expiring soon`,
          html: identityDocumentExpiringAdminEmail({
            employeeName: doc.employeeFullName,
            documentTypeLabel: typeLabel,
            daysUntilExpiry,
            complianceUrl: `${origin}/dashboard/compliance`,
          }),
        });
      }

      await sendEmail({
        to: doc.employeeEmail,
        subject: `Your ${typeLabel} is expiring soon`,
        html: identityDocumentExpiringEmployeeEmail({
          employeeName: doc.employeeFullName,
          documentTypeLabel: typeLabel,
          daysUntilExpiry,
        }),
      });

      await db.insert(identityDocumentReminders).values({ identityDocumentId: doc.id, intervalDays: threshold });
      await logAuditEvent({
        action: "identity_document.expiry_reminder_sent",
        actorEmail: null,
        tenantId: doc.tenantId,
        metadata: { identityDocumentId: doc.id, intervalDays: threshold, daysUntilExpiry },
      });

      remindersSent += 1;
      break;
    }
  }

  return NextResponse.json({ remindersSent });
};
