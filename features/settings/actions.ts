"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/drizzle/schema";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { companySettingsSchema } from "./schema";

export type SettingsActionResult = { success: true } | { success: false; error: string };

export const getCompanySettings = async () => {
  const profile = await getCurrentProfile();
  return {
    companyName: profile.companyName,
    address: profile.address ?? "",
    taxId: profile.taxId ?? "",
    regon: profile.regon ?? "",
    krs: profile.krs ?? "",
    logoUrl: profile.logoUrl ?? "",
    notifyOnSignatureNeeded: profile.notifyOnSignatureNeeded,
  };
};

export const updateCompanySettings = async (values: unknown): Promise<SettingsActionResult> => {
  const profile = await getCurrentProfile();
  const parsed = companySettingsSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db
    .update(profiles)
    .set({
      companyName: parsed.data.companyName,
      address: parsed.data.address || null,
      taxId: parsed.data.taxId || null,
      regon: parsed.data.regon || null,
      krs: parsed.data.krs || null,
      logoUrl: parsed.data.logoUrl || null,
      notifyOnSignatureNeeded: parsed.data.notifyOnSignatureNeeded,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profile.id));

  revalidatePath("/dashboard/settings");
  return { success: true };
};
