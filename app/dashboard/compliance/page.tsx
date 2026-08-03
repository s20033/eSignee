import { ComplianceFilters } from "@/features/identity-documents/components/compliance-filters";
import { ComplianceTable } from "@/features/identity-documents/components/compliance-table";
import { listAllIdentityDocuments } from "@/features/identity-documents/actions";

type CompliancePageProps = {
  searchParams: Promise<{ type?: string; status?: string; sort?: "asc" | "desc" }>;
};

const CompliancePage = async ({ searchParams }: CompliancePageProps) => {
  const params = await searchParams;
  const rows = await listAllIdentityDocuments(params);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Compliance</h1>
        <p className="text-sm text-muted-foreground">
          Every identity document on file, sorted by expiry — passport, work permit, and visa renewals in one
          place.
        </p>
      </div>

      <ComplianceFilters />
      <ComplianceTable rows={rows} />
    </div>
  );
};

export default CompliancePage;
