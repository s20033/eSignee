import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/drizzle/schema";
import { createClient } from "@/lib/supabase/server";

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

  const [created] = await db
    .insert(profiles)
    .values({
      id: user.id,
      email: user.email ?? "",
      companyName,
    })
    .returning();

  return created;
};
