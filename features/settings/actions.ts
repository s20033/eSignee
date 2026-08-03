"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, tenantDocumentSettings, tenants } from "@/drizzle/schema";
import { requireTenantAdmin } from "@/lib/auth/get-current-profile";
import { getCurrentTenant } from "@/lib/auth/get-current-tenant";
import { generateInviteCode } from "@/lib/auth/generate-invite-code";
import { getAppOrigin } from "@/lib/get-app-origin";
import { logAuditEvent } from "@/lib/audit/log";
import { companySettingsSchema, signatorySettingsSchema } from "./schema";

export type SettingsActionResult = { success: true } | { success: false; error: string };

export const getCompanySettings = async () => {
  const [profile, tenant] = await Promise.all([requireTenantAdmin(), getCurrentTenant()]);
  return {
    companyName: profile.companyName,
    address: profile.address ?? "",
    taxId: profile.taxId ?? "",
    regon: profile.regon ?? "",
    krs: profile.krs ?? "",
    logoUrl: profile.logoUrl ?? "",
    notifyOnSignatureNeeded: profile.notifyOnSignatureNeeded,
    defaultSigningPlace: tenant.defaultSigningPlace,
  };
};

export const getSignatorySettings = async () => {
  const tenant = await getCurrentTenant();

  const [settings] = await db
    .select()
    .from(tenantDocumentSettings)
    .where(eq(tenantDocumentSettings.tenantId, tenant.id))
    .limit(1);

  return {
    signatoryName: settings?.signatoryName ?? "",
    signatoryTitle: settings?.signatoryTitle ?? "",
  };
};

export const updateSignatorySettings = async (values: unknown): Promise<SettingsActionResult> => {
  const [profile, tenant] = await Promise.all([requireTenantAdmin(), getCurrentTenant()]);
  const parsed = signatorySettingsSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // No row exists for either pre-Phase-3 tenant yet — this table was added
  // in Phase 1 but never written to until now, so upsert rather than update.
  await db
    .insert(tenantDocumentSettings)
    .values({
      tenantId: tenant.id,
      signatoryName: parsed.data.signatoryName || null,
      signatoryTitle: parsed.data.signatoryTitle || null,
    })
    .onConflictDoUpdate({
      target: tenantDocumentSettings.tenantId,
      set: {
        signatoryName: parsed.data.signatoryName || null,
        signatoryTitle: parsed.data.signatoryTitle || null,
        updatedAt: new Date(),
      },
    });

  await logAuditEvent({
    action: "tenant.signatory_updated",
    actorEmail: profile.email,
    tenantId: tenant.id,
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
};

export const getEmployeeInviteLink = async () => {
  const [tenant, origin] = await Promise.all([getCurrentTenant(), getAppOrigin()]);
  return `${origin}/join/${tenant.employeeInviteCode}`;
};

export const regenerateEmployeeInviteLink = async (): Promise<SettingsActionResult> => {
  const [profile, tenant] = await Promise.all([requireTenantAdmin(), getCurrentTenant()]);

  await db
    .update(tenants)
    .set({ employeeInviteCode: generateInviteCode(), updatedAt: new Date() })
    .where(eq(tenants.id, tenant.id));

  await logAuditEvent({
    action: "tenant.invite_code_regenerated",
    actorEmail: profile.email,
    tenantId: tenant.id,
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
};

export const updateCompanySettings = async (values: unknown): Promise<SettingsActionResult> => {
  const [profile, tenant] = await Promise.all([requireTenantAdmin(), getCurrentTenant()]);
  const parsed = companySettingsSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await Promise.all([
    db
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
      .where(eq(profiles.id, profile.id)),
    db
      .update(tenants)
      .set({
        name: parsed.data.companyName,
        address: parsed.data.address || null,
        logoUrl: parsed.data.logoUrl || null,
        defaultSigningPlace: parsed.data.defaultSigningPlace,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenant.id)),
  ]);

  revalidatePath("/dashboard/settings");
  return { success: true };
};
