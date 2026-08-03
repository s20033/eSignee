"use server";

import { revalidatePath } from "next/cache";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, employees, profiles, tenants } from "@/drizzle/schema";
import { getCurrentSuperAdmin } from "@/lib/auth/get-current-super-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { logAuditEvent } from "@/lib/audit/log";
import { updateTenantPlanSchema, type TenantStatusValue } from "./schema";

export type SuperAdminActionResult = { success: true } | { success: false; error: string };

/** Every tenant with a quick health snapshot — employee/document counts and the founding admin's email. */
export const listTenants = async () => {
  await getCurrentSuperAdmin();

  const [allTenants, employeeCounts, documentCounts, adminRows] = await Promise.all([
    db.select().from(tenants).where(isNull(tenants.deletedAt)).orderBy(desc(tenants.createdAt)),
    db
      .select({ tenantId: employees.tenantId, total: count() })
      .from(employees)
      .where(isNull(employees.deletedAt))
      .groupBy(employees.tenantId),
    db.select({ tenantId: documents.tenantId, total: count() }).from(documents).groupBy(documents.tenantId),
    db
      .select({ tenantId: profiles.tenantId, email: profiles.email, createdAt: profiles.createdAt })
      .from(profiles)
      .where(and(eq(profiles.role, "tenant_admin"), eq(profiles.status, "active")))
      .orderBy(profiles.createdAt),
  ]);

  const employeeCountByTenant = new Map(employeeCounts.map((row) => [row.tenantId, row.total]));
  const documentCountByTenant = new Map(documentCounts.map((row) => [row.tenantId, row.total]));
  const adminEmailByTenant = new Map<string, string>();
  for (const row of adminRows) {
    if (!adminEmailByTenant.has(row.tenantId)) adminEmailByTenant.set(row.tenantId, row.email);
  }

  return allTenants.map((tenant) => ({
    ...tenant,
    employeeCount: employeeCountByTenant.get(tenant.id) ?? 0,
    documentCount: documentCountByTenant.get(tenant.id) ?? 0,
    adminEmail: adminEmailByTenant.get(tenant.id) ?? null,
  }));
};

export const getTenantDetail = async (tenantId: string) => {
  await getCurrentSuperAdmin();

  const [[tenant], admins, [{ employeeTotal }], [{ documentTotal }]] = await Promise.all([
    db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1),
    db
      .select({ id: profiles.id, email: profiles.email, status: profiles.status, createdAt: profiles.createdAt })
      .from(profiles)
      .where(and(eq(profiles.tenantId, tenantId), eq(profiles.role, "tenant_admin")))
      .orderBy(profiles.createdAt),
    db
      .select({ employeeTotal: count() })
      .from(employees)
      .where(and(eq(employees.tenantId, tenantId), isNull(employees.deletedAt))),
    db.select({ documentTotal: count() }).from(documents).where(eq(documents.tenantId, tenantId)),
  ]);

  if (!tenant) return null;

  return { tenant, admins, employeeTotal, documentTotal };
};

export const updateTenantPlan = async (tenantId: string, values: unknown): Promise<SuperAdminActionResult> => {
  const superAdmin = await getCurrentSuperAdmin();
  const parsed = updateTenantPlanSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.update(tenants).set({ plan: parsed.data.plan, updatedAt: new Date() }).where(eq(tenants.id, tenantId));

  await logAuditEvent({
    action: "super_admin.tenant_plan_updated",
    actorEmail: superAdmin.email,
    tenantId,
    metadata: { plan: parsed.data.plan },
  });

  revalidatePath(`/super-admin/tenants/${tenantId}`);
  return { success: true };
};

export const updateTenantStatus = async (
  tenantId: string,
  status: TenantStatusValue,
): Promise<SuperAdminActionResult> => {
  const superAdmin = await getCurrentSuperAdmin();

  await db.update(tenants).set({ status, updatedAt: new Date() }).where(eq(tenants.id, tenantId));

  await logAuditEvent({
    action: "super_admin.tenant_status_updated",
    actorEmail: superAdmin.email,
    tenantId,
    metadata: { status },
  });

  revalidatePath(`/super-admin/tenants/${tenantId}`);
  return { success: true };
};

export type ImpersonateResult = { success: true; link: string } | { success: false; error: string };

/**
 * "Impersonation" here means generating a one-time magic-link sign-in for
 * the tenant's admin, not a simultaneous dual session — the super admin
 * opens the link and is now looking at exactly what that admin sees. Every
 * generation is audit-logged (who, which tenant, when) regardless of
 * whether the link is ever used.
 */
export const impersonateTenantAdmin = async (tenantId: string): Promise<ImpersonateResult> => {
  const superAdmin = await getCurrentSuperAdmin();

  const [admin] = await db
    .select({ email: profiles.email })
    .from(profiles)
    .where(and(eq(profiles.tenantId, tenantId), eq(profiles.role, "tenant_admin"), eq(profiles.status, "active")))
    .orderBy(profiles.createdAt)
    .limit(1);

  if (!admin) {
    return { success: false, error: "This tenant has no active admin to impersonate." };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.generateLink({ type: "magiclink", email: admin.email });

  if (error || !data.properties?.action_link) {
    return { success: false, error: error?.message ?? "Could not generate a sign-in link." };
  }

  await logAuditEvent({
    action: "super_admin.impersonation_started",
    actorEmail: superAdmin.email,
    tenantId,
    metadata: { impersonatedEmail: admin.email },
  });

  return { success: true, link: data.properties.action_link };
};
