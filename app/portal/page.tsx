import { EmployeeSummaryCard } from "@/features/employees/components/employee-summary-card";
import { getCurrentPortalUser } from "@/lib/auth/get-current-portal-user";

const PortalOverviewPage = async () => {
  const { employee } = await getCurrentPortalUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {employee.fullName}</h1>
        <p className="text-sm text-muted-foreground">Your employment details on file.</p>
      </div>

      <EmployeeSummaryCard employee={employee} />
    </div>
  );
};

export default PortalOverviewPage;
