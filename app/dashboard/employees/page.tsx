import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuerySearch } from "@/components/shared/query-search";
import { QueryPagination } from "@/components/shared/query-pagination";
import { EmployeeTable } from "@/features/employees/components/employee-table";
import { listEmployees } from "@/features/employees/actions";

type EmployeesPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

const EmployeesPage = async ({ searchParams }: EmployeesPageProps) => {
  const params = await searchParams;
  const search = params.q ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const { employees, total, pageSize } = await listEmployees(search, page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employees</h1>
        <Button nativeButton={false} render={<Link href="/dashboard/employees/new" />}>Add employee</Button>
      </div>

      <QuerySearch placeholder="Search by name or email" />
      <EmployeeTable employees={employees} />
      <QueryPagination page={page} totalPages={totalPages} />
    </div>
  );
};

export default EmployeesPage;
