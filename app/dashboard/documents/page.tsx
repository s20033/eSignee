import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuerySearch } from "@/components/shared/query-search";
import { QueryPagination } from "@/components/shared/query-pagination";
import { DocumentTable } from "@/features/documents/components/document-table";
import { DocumentFilters } from "@/features/documents/components/document-filters";
import { listDocuments } from "@/features/documents/actions";
import type { Document } from "@/types/document";

type DocumentsPageProps = {
  searchParams: Promise<{ q?: string; page?: string; status?: string; category?: string }>;
};

const DocumentsPage = async ({ searchParams }: DocumentsPageProps) => {
  const params = await searchParams;
  const search = params.q ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const { documents, total, pageSize } = await listDocuments(search, page, {
    status: params.status as Document["status"] | undefined,
    category: params.category as Document["category"] | undefined,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Every document generated for your company — preview, download, delete, restore, and track its full
            history in one place.
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/dashboard/documents/new" />}>
          New document for a signee
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <QuerySearch placeholder="Search by title or signer" />
        <DocumentFilters />
      </div>
      <DocumentTable key={`${page}-${search}-${params.status ?? ""}-${params.category ?? ""}`} documents={documents} />
      <QueryPagination page={page} totalPages={totalPages} />
    </div>
  );
};

export default DocumentsPage;
