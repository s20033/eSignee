import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Platform Super Admin gate. Deliberately not a `profiles` role — that would
 * mean relaxing `profiles.tenantId` to nullable across the whole codebase
 * for a role that's realistically one or two trusted operators. Instead,
 * gated by an email allowlist (SUPER_ADMIN_EMAILS), checked against the
 * already-authenticated Supabase session. The account itself is an
 * ordinary Supabase Auth user — no special signup path, no `profiles` row
 * required (or expected) for it.
 */
export const getCurrentSuperAdmin = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const allowlist = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (!allowlist.includes(user.email.toLowerCase())) {
    redirect("/login");
  }

  return { email: user.email };
};
