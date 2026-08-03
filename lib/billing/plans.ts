/**
 * Plan tiers only — no billing enforcement or Stripe integration yet
 * (deferred; see Phase 5 notes). Living here rather than in a feature
 * folder so the eventual billing integration has one place to land without
 * disturbing signup or the Super Admin panel, both of which just need the
 * tier list.
 */
export const TENANT_PLANS = ["free", "pro", "enterprise"] as const;
export type TenantPlan = (typeof TENANT_PLANS)[number];

export const TENANT_PLAN_LABELS: Record<TenantPlan, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};
