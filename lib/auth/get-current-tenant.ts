import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tenants } from "@/drizzle/schema";
import { requireTenantAdmin } from "./get-current-profile";

/** Only ever called from dashboard/admin code paths — never the employee portal — so it enforces tenant_admin itself rather than trusting each caller to. */
export const getCurrentTenant = async () => {
  const profile = await requireTenantAdmin();

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, profile.tenantId)).limit(1);

  if (!tenant) {
    throw new Error("Tenant not found for current profile");
  }

  return tenant;
};
