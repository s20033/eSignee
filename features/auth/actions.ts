"use server";

import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { employees, profiles, tenants } from "@/drizzle/schema";
import { getAppOrigin } from "@/lib/get-app-origin";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { employeeAccountPendingEmail } from "@/lib/email/templates";
import { logAuditEvent } from "@/lib/audit/log";
import { toEmployeeInsertValues } from "@/features/employees/schema";
import {
  forgotPasswordSchema,
  loginSchema,
  mfaCodeSchema,
  registerEmployeeSchema,
  resetPasswordSchema,
  signUpSchema,
} from "./schema";

export type LoginActionResult =
  | { success: true; mfaRequired: false; redirectTo: string }
  | { success: true; mfaRequired: true; factorId: string }
  | { success: false; error: string };

/** tenant_admin (and any profile-less/legacy session) lands on /dashboard; employee accounts land on /portal. */
const getPostLoginRedirect = async (userId: string) => {
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, userId)).limit(1);
  return profile?.role === "employee" ? "/portal" : "/dashboard";
};

export const signIn = async (values: unknown): Promise<LoginActionResult> => {
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !signInData.user) {
    return { success: false, error: "Invalid email or password" };
  }

  const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (!aalError && aal.nextLevel === "aal2" && aal.currentLevel !== aal.nextLevel) {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totpFactor = factors?.totp.find((factor) => factor.status === "verified");

    if (totpFactor) {
      return { success: true, mfaRequired: true, factorId: totpFactor.id };
    }
  }

  return { success: true, mfaRequired: false, redirectTo: await getPostLoginRedirect(signInData.user.id) };
};

export type MfaChallengeResult = { success: true; redirectTo: string } | { success: false; error: string };

export const verifyMfaChallenge = async (
  factorId: string,
  values: unknown,
): Promise<MfaChallengeResult> => {
  const parsed = mfaCodeSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid code" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: parsed.data.code,
  });

  if (error || !data.user) {
    return { success: false, error: "Invalid or expired code" };
  }

  return { success: true, redirectTo: await getPostLoginRedirect(data.user.id) };
};

export type PasswordResetResult = { success: true } | { success: false; error: string };

export const requestPasswordReset = async (values: unknown): Promise<PasswordResetResult> => {
  const parsed = forgotPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const origin = await getAppOrigin();
  const supabase = await createClient();

  // Always return success regardless of whether the email exists, to avoid leaking account existence.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  return { success: true };
};

export const updatePassword = async (values: unknown): Promise<PasswordResetResult> => {
  const parsed = resetPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

export type SignUpActionResult =
  | { success: true; needsEmailConfirmation: boolean }
  | { success: false; error: string };

export const signUp = async (values: unknown): Promise<SignUpActionResult> => {
  const parsed = signUpSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const origin = await getAppOrigin();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { company_name: parsed.data.companyName, plan: parsed.data.plan },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, needsEmailConfirmation: !data.session };
};

export const signOut = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
};

/** Public lookup for the /join/{code} page — resolves an invite code to the tenant name it belongs to, or null if the code is invalid. */
export const getTenantByInviteCode = async (code: string) => {
  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(and(eq(tenants.employeeInviteCode, code.toUpperCase()), isNull(tenants.deletedAt)))
    .limit(1);

  return tenant ?? null;
};

export type RegisterEmployeeResult =
  | { success: true; needsEmailConfirmation: boolean }
  | { success: false; error: string };

export const registerEmployee = async (
  inviteCode: string,
  values: unknown,
): Promise<RegisterEmployeeResult> => {
  const parsed = registerEmployeeSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const tenant = await getTenantByInviteCode(inviteCode);
  if (!tenant) {
    return { success: false, error: "This invite link is no longer valid." };
  }

  const origin = await getAppOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }
  if (!data.user) {
    return { success: false, error: "Could not create account." };
  }

  // A tenant needs at least one active tenant_admin for employerId — the
  // employees row still tracks "who administratively owns this record" even
  // though tenantId (not employerId) is what actually scopes visibility.
  const [admin] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.tenantId, tenant.id), eq(profiles.role, "tenant_admin"), eq(profiles.status, "active")))
    .orderBy(asc(profiles.createdAt))
    .limit(1);

  if (!admin) {
    return { success: false, error: "This company's account isn't set up correctly. Contact support." };
  }

  // Created eagerly (rather than lazily on first login, like tenant_admin
  // profiles) so the pending-approval request is visible to the tenant admin
  // right away, without waiting on the employee to confirm their email first.
  // The employees row is created now too, with everything the applicant
  // submitted, so the admin reviews real data — not just a name and email —
  // before approving. It stays invisible on the regular Employees list until
  // approved (see notPendingSelfRegistration in features/employees/actions.ts).
  await db.transaction(async (tx) => {
    await tx.insert(profiles).values({
      id: data.user!.id,
      tenantId: tenant.id,
      role: "employee",
      status: "pending",
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      companyName: tenant.name,
    });

    await tx
      .insert(employees)
      .values({ ...toEmployeeInsertValues(parsed.data, admin.id, tenant.id), userId: data.user!.id });
  });

  await logAuditEvent({
    action: "employee.registered",
    actorEmail: parsed.data.email,
    tenantId: tenant.id,
    metadata: { fullName: parsed.data.fullName },
  });

  const admins = await db
    .select({ email: profiles.email })
    .from(profiles)
    .where(and(eq(profiles.tenantId, tenant.id), eq(profiles.role, "tenant_admin"), eq(profiles.status, "active")));

  await Promise.all(
    admins.map((admin) =>
      sendEmail({
        to: admin.email,
        subject: `New account request from ${parsed.data.fullName}`,
        html: employeeAccountPendingEmail({
          employeeName: parsed.data.fullName,
          approvalsUrl: `${origin}/dashboard/approvals`,
        }),
      }),
    ),
  );

  return { success: true, needsEmailConfirmation: !data.session };
};
