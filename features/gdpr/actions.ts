"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  auditLogs,
  documents,
  employees,
  identityDocuments,
  profiles,
  templates,
  tenantDocumentSettings,
} from "@/drizzle/schema";
import { requireTenantAdmin } from "@/lib/auth/get-current-profile";
import { getCurrentTenant } from "@/lib/auth/get-current-tenant";
import { logAuditEvent } from "@/lib/audit/log";

export type GdprActionResult = { success: true } | { success: false; error: string };

/**
 * Everything this tenant's own data spans, as one JSON bundle — company
 * branding, employees, templates, document/identity-document metadata
 * (not the PDF/image bytes themselves — those are Storage objects, not
 * database rows), and the full audit trail. Downloaded client-side as a
 * file, same pattern as the compliance CSV export.
 */
export const exportTenantData = async () => {
  const [profile, tenant] = await Promise.all([requireTenantAdmin(), getCurrentTenant()]);

  const [settings, employeeRows, templateRows, documentRows, identityDocumentRows, auditLogRows] = await Promise.all(
    [
      db.select().from(tenantDocumentSettings).where(eq(tenantDocumentSettings.tenantId, tenant.id)).limit(1),
      db.select().from(employees).where(eq(employees.tenantId, tenant.id)),
      db.select().from(templates).where(eq(templates.tenantId, tenant.id)),
      db.select().from(documents).where(eq(documents.tenantId, tenant.id)),
      db.select().from(identityDocuments).where(eq(identityDocuments.tenantId, tenant.id)),
      db.select().from(auditLogs).where(eq(auditLogs.tenantId, tenant.id)),
    ],
  );

  await logAuditEvent({
    action: "gdpr.tenant_data_exported",
    actorEmail: profile.email,
    tenantId: tenant.id,
  });

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      tenant,
      documentSettings: settings[0] ?? null,
      employees: employeeRows,
      templates: templateRows,
      documents: documentRows,
      identityDocuments: identityDocumentRows,
      auditLog: auditLogRows,
    },
    null,
    2,
  );
};

// Fields actually erased on the employees row — direct identifiers and
// government-issued document numbers. Employment metadata (position, dates,
// pay figures, isForeigner/isStudent) is deliberately kept: on its own it
// doesn't identify a natural person once the fields below are gone, and
// aggregate payroll/statutory records often have their own retention
// requirements independent of any one individual's erasure request.
export const anonymizeEmployee = async (employeeId: string): Promise<GdprActionResult> => {
  const profile = await requireTenantAdmin();

  const [employee] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.tenantId, profile.tenantId), isNull(employees.deletedAt)))
    .limit(1);

  if (!employee) {
    return { success: false, error: "Employee not found." };
  }

  const anonymizedEmail = `erased-${employee.id}@anonymized.local`;

  await db.transaction(async (tx) => {
    await tx
      .update(employees)
      .set({
        fullName: "Erased employee",
        email: anonymizedEmail,
        passportNumber: null,
        pesel: null,
        nationality: null,
        address: null,
        bankName: null,
        iban: null,
        citizenship: null,
        foreignerDocumentNumber: null,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(employees.id, employeeId));

    if (employee.userId) {
      await tx
        .update(profiles)
        .set({ fullName: "Erased employee", email: anonymizedEmail, status: "disabled", updatedAt: new Date() })
        .where(eq(profiles.id, employee.userId));
    }

    await tx
      .update(identityDocuments)
      .set({ deletedAt: new Date() })
      .where(eq(identityDocuments.employeeId, employeeId));
  });

  // Deliberately not passing metadata with any of the erased fields — the
  // audit record should prove erasure happened, not survive as a backdoor
  // copy of the data that was just erased.
  await logAuditEvent({
    action: "employee.anonymized",
    actorEmail: profile.email,
    tenantId: profile.tenantId,
    metadata: { employeeId },
  });

  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${employeeId}/edit`);
  return { success: true };
};
