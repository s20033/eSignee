import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuerySearch } from "@/components/shared/query-search";
import { QueryPagination } from "@/components/shared/query-pagination";
import { QuerySelectFilter } from "@/components/shared/query-select-filter";
import { TemplateTable } from "@/features/templates/components/template-table";
import { listTemplates } from "@/features/templates/actions";
import { DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from "@/lib/documents/category-labels";

type TemplatesPageProps = {
  searchParams: Promise<{ q?: string; page?: string; category?: string }>;
};

const TemplatesPage = async ({ searchParams }: TemplatesPageProps) => {
  const params = await searchParams;
  const search = params.q ?? "";
  const page = Math.max(1, Number(params.page) || 1);
  const category = params.category as DocumentCategory | undefined;

  const { templates, total, pageSize } = await listTemplates(search, page, category);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Templates</h1>
        <Button nativeButton={false} render={<Link href="/dashboard/templates/new" />}>Add template</Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <QuerySearch placeholder="Search by name" />
        <QuerySelectFilter
          param="category"
          placeholder="All categories"
          options={Object.entries(DOCUMENT_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>
      <TemplateTable templates={templates} />
      <QueryPagination page={page} totalPages={totalPages} />
    </div>
  );
};

export default TemplatesPage;
