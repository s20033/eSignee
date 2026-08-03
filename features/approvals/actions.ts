"use server";

import { revalidatePath } from "next/cache";
import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { employees, profiles } from "@/drizzle/schema";
import { requireTenantAdmin } from "@/lib/auth/get-current-profile";
import { logAuditEvent } from "@/lib/audit/log";
import { sendEmail } from "@/lib/email/send";
import { employeeAccountApprovedEmail, employeeAccountRejectedEmail } from "@/lib/email/templates";
import { rejectEmployeeSchema } from "@/features/auth/schema";

export type ApprovalActionResult = { success: true } | { success: false; error: string };

/** Employee accounts awaiting this tenant's approval, oldest first. */
export const listPendingEmployees = async () => {
  const profile = await requireTenantAdmin();

  return db
    .select()
    .from(profiles)
    .where(
      and(eq(profiles.tenantId, profile.tenantId), eq(profiles.role, "employee"), eq(profiles.status, "pending")),
    )
    .orderBy(asc(profiles.createdAt));
};

/** Powers the sidebar's "Pending approvals" badge. */
export const countPendingEmployees = async () => {
  const profile = await requireTenantAdmin();

  const [row] = await db
    .select({ total: count() })
    .from(profiles)
    .where(
      and(eq(profiles.tenantId, profile.tenantId), eq(profiles.role, "employee"), eq(profiles.status, "pending")),
    );

  return row?.total ?? 0;
};

/** Full submitted record for one pending request, so the admin can review it before deciding. */
export const getPendingRequestDetail = async (employeeProfileId: string) => {
  const profile = await requireTenantAdmin();
  const target = await getPendingRequest(employeeProfileId, profile.tenantId);
  if (!target) return null;

  const [employee] = await db.select().from(employees).where(eq(employees.userId, target.id)).limit(1);

  return { request: target, employee: employee ?? null };
};

const getPendingRequest = async (employeeProfileId: string, tenantId: string) => {
  const [target] = await db
    .select()
    .from(profiles)
    .where(
      and(
        eq(profiles.id, employeeProfileId),
        eq(profiles.tenantId, tenantId),
        eq(profiles.role, "employee"),
        eq(profiles.status, "pending"),
      ),
    )
    .limit(1);

  return target ?? null;
};

export const approveEmployee = async (employeeProfileId: string): Promise<ApprovalActionResult> => {
  const profile = await requireTenantAdmin();
  const target = await getPendingRequest(employeeProfileId, profile.tenantId);

  if (!target) {
    return { success: false, error: "Request not found." };
  }

  // registerEmployee creates the employees row up front (with everything the
  // applicant submitted), so approval is just a status flip — no employees
  // insert needed. The fallback below only matters for a row created before
  // this change, or if the insert somehow didn't happen.
  const [existingEmployee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.userId, target.id))
    .limit(1);

  await db.transaction(async (tx) => {
    if (!existingEmployee) {
      await tx.insert(employees).values({
        employerId: profile.id,
        tenantId: profile.tenantId,
        userId: target.id,
        fullName: target.fullName || target.email,
        email: target.email,
      });
    }

    await tx.update(profiles).set({ status: "active", updatedAt: new Date() }).where(eq(profiles.id, target.id));
  });

  await logAuditEvent({
    action: "employee.approved",
    actorEmail: profile.email,
    tenantId: profile.tenantId,
    metadata: { employeeProfileId: target.id },
  });

  await sendEmail({
    to: target.email,
    subject: "Your account is approved",
    html: employeeAccountApprovedEmail({ employeeName: target.fullName || target.email, companyName: profile.companyName }),
  });

  revalidatePath("/dashboard/approvals");
  return { success: true };
};

export const rejectEmployee = async (
  employeeProfileId: string,
  values: unknown,
): Promise<ApprovalActionResult> => {
  const profile = await requireTenantAdmin();
  const parsed = rejectEmployeeSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "A reason is required." };
  }

  const target = await getPendingRequest(employeeProfileId, profile.tenantId);
  if (!target) {
    return { success: false, error: "Request not found." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({ status: "rejected", rejectionReason: parsed.data.reason, updatedAt: new Date() })
      .where(eq(profiles.id, target.id));

    // Soft-delete the record the applicant submitted — it never became a
    // real employee, so it shouldn't linger anywhere it could be mistaken
    // for one (matches deleteEmployee's own soft-delete convention).
    await tx.update(employees).set({ deletedAt: new Date() }).where(eq(employees.userId, target.id));
  });

  await logAuditEvent({
    action: "employee.rejected",
    actorEmail: profile.email,
    tenantId: profile.tenantId,
    metadata: { employeeProfileId: target.id, reason: parsed.data.reason },
  });

  await sendEmail({
    to: target.email,
    subject: "Account request not approved",
    html: employeeAccountRejectedEmail({
      employeeName: target.fullName || target.email,
      companyName: profile.companyName,
      reason: parsed.data.reason,
    }),
  });

  revalidatePath("/dashboard/approvals");
  return { success: true };
};
