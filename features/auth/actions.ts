"use server";

import { getAppOrigin } from "@/lib/get-app-origin";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  mfaCodeSchema,
  resetPasswordSchema,
  signUpSchema,
} from "./schema";

export type LoginActionResult =
  | { success: true; mfaRequired: false }
  | { success: true; mfaRequired: true; factorId: string }
  | { success: false; error: string };

export const signIn = async (values: unknown): Promise<LoginActionResult> => {
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
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

  return { success: true, mfaRequired: false };
};

export type MfaChallengeResult = { success: true } | { success: false; error: string };

export const verifyMfaChallenge = async (
  factorId: string,
  values: unknown,
): Promise<MfaChallengeResult> => {
  const parsed = mfaCodeSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid code" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: parsed.data.code,
  });

  if (error) {
    return { success: false, error: "Invalid or expired code" };
  }

  return { success: true };
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
      data: { company_name: parsed.data.companyName },
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
