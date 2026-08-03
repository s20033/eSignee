import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeSummaryCard } from "@/features/employees/components/employee-summary-card";
import { ApprovalDetailActions } from "@/features/approvals/components/approval-detail-actions";
import { getPendingRequestDetail } from "@/features/approvals/actions";

type ApprovalDetailPageProps = {
  params: Promise<{ id: string }>;
};

const ApprovalDetailPage = async ({ params }: ApprovalDetailPageProps) => {
  const { id } = await params;
  const detail = await getPendingRequestDetail(id);

  if (!detail) {
    notFound();
  }

  const { request, employee } = detail;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/approvals"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Back to pending approvals
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">{request.fullName ?? request.email}</h1>
        <p className="text-sm text-muted-foreground">
          Requested access on {request.createdAt.toLocaleDateString()}
        </p>
      </div>

      {employee ? (
        <EmployeeSummaryCard employee={employee} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Employee details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No additional details were submitted with this request.
            </p>
          </CardContent>
        </Card>
      )}

      <ApprovalDetailActions employeeProfileId={request.id} employeeName={request.fullName ?? request.email} />
    </div>
  );
};

export default ApprovalDetailPage;
