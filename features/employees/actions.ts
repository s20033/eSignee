"use server";

import { revalidatePath } from "next/cache";
import { and, asc, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { employees, profiles } from "@/drizzle/schema";
import { requireTenantAdmin } from "@/lib/auth/get-current-profile";
import { logAuditEvent } from "@/lib/audit/log";
import { employeeFormSchema, toEmployeeInsertValues } from "./schema";

const PAGE_SIZE = 10;

export type EmployeeActionResult = { success: true } | { success: false; error: string };

// Self-registered employees (features/auth/actions.ts::registerEmployee) get
// their `employees` row created immediately, before a tenant_admin has
// approved the account — so the regular employee list must hide it until
// that linked profile is out of the `pending` state, or admins would see
// unapproved, unverified data as if it were a real employee.
const notPendingSelfRegistration = sql`not exists (
  select 1 from ${profiles} p where p.id = ${employees.userId} and p.status = 'pending'
)`;

export const listEmployees = async (search: string, page: number) => {
  const profile = await requireTenantAdmin();

  const whereClause = and(
    eq(employees.tenantId, profile.tenantId),
    isNull(employees.deletedAt),
    notPendingSelfRegistration,
    search
      ? or(ilike(employees.fullName, `%${search}%`), ilike(employees.email, `%${search}%`))
      : undefined,
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(employees)
      .where(whereClause)
      .orderBy(asc(employees.fullName))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(employees).where(whereClause),
  ]);

  return { employees: rows, total, pageSize: PAGE_SIZE };
};

export const getEmployeeById = async (id: string) => {
  const profile = await requireTenantAdmin();

  const [employee] = await db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.id, id),
        eq(employees.tenantId, profile.tenantId),
        isNull(employees.deletedAt),
      ),
    )
    .limit(1);

  return employee ?? null;
};

export const createEmployee = async (values: unknown): Promise<EmployeeActionResult> => {
  const profile = await requireTenantAdmin();
  const parsed = employeeFormSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [created] = await db
    .insert(employees)
    .values(toEmployeeInsertValues(parsed.data, profile.id, profile.tenantId))
    .returning({ id: employees.id });

  await logAuditEvent({
    action: "employee.created",
    actorEmail: profile.email,
    tenantId: profile.tenantId,
    metadata: { employeeId: created.id, fullName: parsed.data.fullName },
  });

  revalidatePath("/dashboard/employees");
  return { success: true };
};

export const updateEmployee = async (
  id: string,
  values: unknown,
): Promise<EmployeeActionResult> => {
  const profile = await requireTenantAdmin();
  const parsed = employeeFormSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db
    .update(employees)
    .set({ ...toEmployeeInsertValues(parsed.data, profile.id, profile.tenantId), updatedAt: new Date() })
    .where(and(eq(employees.id, id), eq(employees.tenantId, profile.tenantId)));

  await logAuditEvent({
    action: "employee.updated",
    actorEmail: profile.email,
    tenantId: profile.tenantId,
    metadata: { employeeId: id },
  });

  revalidatePath("/dashboard/employees");
  return { success: true };
};

export const deleteEmployee = async (id: string) => {
  const profile = await requireTenantAdmin();

  await db
    .update(employees)
    .set({ deletedAt: new Date() })
    .where(and(eq(employees.id, id), eq(employees.tenantId, profile.tenantId)));

  await logAuditEvent({
    action: "employee.deleted",
    actorEmail: profile.email,
    tenantId: profile.tenantId,
    metadata: { employeeId: id },
  });

  revalidatePath("/dashboard/employees");
};
