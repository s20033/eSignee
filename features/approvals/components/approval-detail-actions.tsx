"use client";

import { useRouter } from "next/navigation";
import { ApproveButton } from "./approve-button";
import { RejectDialog } from "./reject-dialog";

type ApprovalDetailActionsProps = {
  employeeProfileId: string;
  employeeName: string;
};

export const ApprovalDetailActions = ({ employeeProfileId, employeeName }: ApprovalDetailActionsProps) => {
  const router = useRouter();
  const onDecided = () => router.push("/dashboard/approvals");

  return (
    <div className="flex gap-2">
      <ApproveButton employeeProfileId={employeeProfileId} onSuccess={onDecided} />
      <RejectDialog employeeProfileId={employeeProfileId} employeeName={employeeName} onSuccess={onDecided} />
    </div>
  );
};
