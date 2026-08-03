import { ApprovalsTable } from "@/features/approvals/components/approvals-table";
import { listPendingEmployees } from "@/features/approvals/actions";

const ApprovalsPage = async () => {
  const requests = await listPendingEmployees();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pending approvals</h1>
        <p className="text-sm text-muted-foreground">
          Review and approve employees who have requested access.
        </p>
      </div>

      <ApprovalsTable requests={requests} />
    </div>
  );
};

export default ApprovalsPage;
