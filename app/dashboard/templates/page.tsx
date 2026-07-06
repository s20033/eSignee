import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuerySearch } from "@/components/shared/query-search";
import { QueryPagination } from "@/components/shared/query-pagination";
import { TemplateTable } from "@/features/templates/components/template-table";
import { listTemplates } from "@/features/templates/actions";

type TemplatesPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

const TemplatesPage = async ({ searchParams }: TemplatesPageProps) => {
  const params = await searchParams;
  const search = params.q ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const { templates, total, pageSize } = await listTemplates(search, page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Templates</h1>
        <Button nativeButton={false} render={<Link href="/dashboard/templates/new" />}>Add template</Button>
      </div>

      <QuerySearch placeholder="Search by name" />
      <TemplateTable templates={templates} />
      <QueryPagination page={page} totalPages={totalPages} />
    </div>
  );
};

export default TemplatesPage;
