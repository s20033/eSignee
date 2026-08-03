import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { employees, profiles, tenants } from "@/drizzle/schema";
import { createClient } from "@/lib/supabase/server";

type PortalContext =
  | { status: "pending" }
  | { status: "rejected"; reason: string | null }
  | { status: "suspended" }
  | { status: "active"; profile: typeof profiles.$inferSelect; employee: typeof employees.$inferSelect };

/**
 * Employee-portal equivalent of getCurrentProfile(). Unlike that function,
 * this never auto-creates anything — an employee profile only ever comes
 * from features/auth/actions.ts::registerEmployee (self-registration) or a
 * future employer-initiated invite, so a missing profile here means the
 * session doesn't belong to a registered employee at all.
 *
 * Used by app/portal/layout.tsx, which renders the pending/rejected states
 * itself rather than bouncing the employee back to the login form they just
 * used — being logged in but told to log in again is confusing.
 */
export const getPortalContext = async (): Promise<PortalContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);

  if (!profile || profile.role !== "employee") {
    redirect("/login");
  }

  if (profile.status === "pending") {
    return { status: "pending" };
  }
  if (profile.status === "rejected") {
    return { status: "rejected", reason: profile.rejectionReason };
  }
  if (profile.status === "disabled") {
    redirect("/login");
  }

  const [tenant] = await db.select({ status: tenants.status }).from(tenants).where(eq(tenants.id, profile.tenantId)).limit(1);
  if (tenant?.status === "suspended") {
    return { status: "suspended" };
  }

  const [employee] = await db.select().from(employees).where(eq(employees.userId, profile.id)).limit(1);

  // Shouldn't happen — approveEmployee creates the employees row and flips
  // status to active in the same transaction — but an active employee
  // profile with no linked employees row has nowhere useful to go.
  if (!employee) {
    redirect("/login");
  }

  return { status: "active", profile, employee };
};

/** For portal pages below the layout, which only ever render once the layout has already confirmed an active account. */
export const getCurrentPortalUser = async () => {
  const context = await getPortalContext();

  if (context.status !== "active") {
    redirect("/portal");
  }

  return context;
};
