import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, tenants } from "@/drizzle/schema";
import { createClient } from "@/lib/supabase/server";
import { TENANT_PLANS } from "@/lib/billing/plans";
import { generateInviteCode } from "./generate-invite-code";

export const getCurrentProfile = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (existing) {
    return existing;
  }

  const companyName =
    typeof user.user_metadata.company_name === "string" && user.user_metadata.company_name
      ? user.user_metadata.company_name
      : (user.email ?? "My Company");

  const plan = (TENANT_PLANS as readonly string[]).includes(user.user_metadata.plan)
    ? (user.user_metadata.plan as (typeof TENANT_PLANS)[number])
    : "free";

  // First login for this Supabase Auth user: create the tenant and the
  // (tenant_admin, active) profile together so the app never sees a profile
  // without a tenant.
  //
  // The dashboard layout and page fetch data concurrently (Next.js doesn't
  // serialize sibling Server Component data-fetching), and several of those
  // fetches call getCurrentProfile() independently — so on a brand-new
  // user's first request, two calls can both see no `existing` row and race
  // to insert one. An advisory lock keyed to the user's id serializes just
  // that race: the loser re-checks for the row the winner already created
  // instead of double-inserting (profiles.id is the primary key).
  const created = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${user.id}))`);

    const [alreadyCreated] = await tx.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
    if (alreadyCreated) {
      return alreadyCreated;
    }

    const [tenant] = await tx
      .insert(tenants)
      .values({ name: companyName, employeeInviteCode: generateInviteCode(), plan })
      .returning();

    const [profile] = await tx
      .insert(profiles)
      .values({
        id: user.id,
        tenantId: tenant.id,
        email: user.email ?? "",
        companyName,
      })
      .returning();

    return profile;
  });

  return created;
};

/**
 * Guards every tenant_admin-only Server Action. app/dashboard/layout.tsx
 * already redirects non-tenant_admin roles away from the dashboard, but that
 * check only runs when a *page* renders — Server Actions are independently
 * invocable POST endpoints (Next.js resolves them by an action id, not by
 * which page imported them) and are never routed through a layout's render
 * logic. Without this, an authenticated employee (including one still
 * `pending` approval) could call a tenant_admin action — e.g. approving
 * their own account, or editing another employee's HR record — directly.
 * Every Server Action restricted to the employer/tenant_admin role must call
 * this instead of getCurrentProfile() directly.
 */
export const requireTenantAdmin = async () => {
  const profile = await getCurrentProfile();
  if (profile.role !== "tenant_admin") {
    redirect("/portal");
  }
  return profile;
};
