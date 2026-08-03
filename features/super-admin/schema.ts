import { z } from "zod";
import { TENANT_PLANS } from "@/lib/billing/plans";

export const TENANT_STATUSES = ["active", "suspended"] as const;
export type TenantStatusValue = (typeof TENANT_STATUSES)[number];

export const updateTenantPlanSchema = z.object({
  plan: z.enum(TENANT_PLANS),
});
