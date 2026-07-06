"use server";

import { createClient } from "@/lib/supabase/server";
import { mfaCodeSchema } from "./schema";

export const listMfaFactors = async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  return data?.totp ?? [];
};

export type EnrollMfaResult =
  | { success: true; factorId: string; qrCode: string; secret: string }
  | { success: false; error: string };

export const enrollMfa = async (): Promise<EnrollMfaResult> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
};

export type VerifyMfaEnrollmentResult = { success: true } | { success: false; error: string };

export const verifyMfaEnrollment = async (
  factorId: string,
  values: unknown,
): Promise<VerifyMfaEnrollmentResult> => {
  const parsed = mfaCodeSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid code" };
  }

  const supabase = await createClient();
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });

  if (challengeError) {
    return { success: false, error: challengeError.message };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: parsed.data.code,
  });

  if (verifyError) {
    return { success: false, error: "Invalid code" };
  }

  return { success: true };
};

export const unenrollMfa = async (factorId: string) => {
  const supabase = await createClient();
  await supabase.auth.mfa.unenroll({ factorId });
};
