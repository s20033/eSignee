import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuerySearch } from "@/components/shared/query-search";
import { QueryPagination } from "@/components/shared/query-pagination";
import { SigneeTable } from "@/features/signees/components/signee-table";
import { listSignees } from "@/features/signees/actions";

type SigneesPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

const SigneesPage = async ({ searchParams }: SigneesPageProps) => {
  const params = await searchParams;
  const search = params.q ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const { signees, total, pageSize } = await listSignees(search, page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Signees</h1>
          <p className="text-sm text-muted-foreground">
            External companies and individuals you send documents to outside your employee list.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/dashboard/signees/new" />}>Add signee</Button>
      </div>

      <QuerySearch placeholder="Search by name, email, or company" />
      <SigneeTable signees={signees} />
      <QueryPagination page={page} totalPages={totalPages} />
    </div>
  );
};

export default SigneesPage;
