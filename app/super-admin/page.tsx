import { TenantsTable } from "@/features/super-admin/components/tenants-table";
import { listTenants } from "@/features/super-admin/actions";

const SuperAdminPage = async () => {
  const tenants = await listTenants();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tenants</h1>
        <p className="text-sm text-muted-foreground">Every company using eSignee — {tenants.length} total.</p>
      </div>

      <TenantsTable tenants={tenants} />
    </div>
  );
};

export default SuperAdminPage;
