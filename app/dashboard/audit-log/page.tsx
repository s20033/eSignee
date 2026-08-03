import { QueryPagination } from "@/components/shared/query-pagination";
import { AuditLogTable } from "@/features/audit-log/components/audit-log-table";
import { ExportAuditLogButton } from "@/features/audit-log/components/export-audit-log-button";
import { listAuditLogPage } from "@/features/audit-log/actions";

type AuditLogPageProps = {
  searchParams: Promise<{ page?: string }>;
};

const AuditLogPage = async ({ searchParams }: AuditLogPageProps) => {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const { entries, total, pageSize } = await listAuditLogPage(page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Audit log</h1>
          <p className="text-sm text-muted-foreground">
            Every signed-document event and account-approval decision — the full record for a labor inspection.
          </p>
        </div>
        <ExportAuditLogButton />
      </div>

      <AuditLogTable key={page} entries={entries} />
      <QueryPagination page={page} totalPages={totalPages} />
    </div>
  );
};

export default AuditLogPage;
