"use server";

import { revalidatePath } from "next/cache";
import { and, asc, count, eq, ilike, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { employees } from "@/drizzle/schema";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { logAuditEvent } from "@/lib/audit/log";
import { employeeFormSchema, type EmployeeFormValues } from "./schema";

const PAGE_SIZE = 10;

export type EmployeeActionResult = { success: true } | { success: false; error: string };

const toEmployeeValues = (data: EmployeeFormValues, employerId: string) => ({
  employerId,
  fullName: data.fullName,
  email: data.email,
  position: data.position || null,
  salary: data.salary || null,
  startDate: data.startDate || null,
  endDate: data.endDate || null,
  passportNumber: data.passportNumber || null,
  pesel: data.pesel || null,
  nationality: data.nationality || null,
  address: data.address || null,
  bankName: data.bankName || null,
  iban: data.iban || null,
  jobDescription: data.jobDescription || null,
  hourlyRate: data.hourlyRate || null,
  minHoursPerWeek: data.minHoursPerWeek || null,
  accommodationCost: data.accommodationCost || null,
  isForeigner: data.isForeigner,
  citizenship: data.isForeigner ? data.citizenship || null : null,
  foreignerDocumentType: data.isForeigner ? data.foreignerDocumentType || null : null,
  foreignerDocumentNumber: data.isForeigner ? data.foreignerDocumentNumber || null : null,
  foreignerDocumentExpiry: data.isForeigner ? data.foreignerDocumentExpiry || null : null,
  workBasis: data.isForeigner ? data.workBasis || null : null,
  isStudent: data.isStudent,
});

export const listEmployees = async (search: string, page: number) => {
  const profile = await getCurrentProfile();

  const whereClause = and(
    eq(employees.employerId, profile.id),
    isNull(employees.deletedAt),
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
  const profile = await getCurrentProfile();

  const [employee] = await db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.id, id),
        eq(employees.employerId, profile.id),
        isNull(employees.deletedAt),
      ),
    )
    .limit(1);

  return employee ?? null;
};

export const createEmployee = async (values: unknown): Promise<EmployeeActionResult> => {
  const profile = await getCurrentProfile();
  const parsed = employeeFormSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [created] = await db
    .insert(employees)
    .values(toEmployeeValues(parsed.data, profile.id))
    .returning({ id: employees.id });

  await logAuditEvent({
    action: "employee.created",
    actorEmail: profile.email,
    metadata: { employeeId: created.id, fullName: parsed.data.fullName },
  });

  revalidatePath("/dashboard/employees");
  return { success: true };
};

export const updateEmployee = async (
  id: string,
  values: unknown,
): Promise<EmployeeActionResult> => {
  const profile = await getCurrentProfile();
  const parsed = employeeFormSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db
    .update(employees)
    .set({ ...toEmployeeValues(parsed.data, profile.id), updatedAt: new Date() })
    .where(and(eq(employees.id, id), eq(employees.employerId, profile.id)));

  await logAuditEvent({
    action: "employee.updated",
    actorEmail: profile.email,
    metadata: { employeeId: id },
  });

  revalidatePath("/dashboard/employees");
  return { success: true };
};

export const deleteEmployee = async (id: string) => {
  const profile = await getCurrentProfile();

  await db
    .update(employees)
    .set({ deletedAt: new Date() })
    .where(and(eq(employees.id, id), eq(employees.employerId, profile.id)));

  await logAuditEvent({
    action: "employee.deleted",
    actorEmail: profile.email,
    metadata: { employeeId: id },
  });

  revalidatePath("/dashboard/employees");
};
