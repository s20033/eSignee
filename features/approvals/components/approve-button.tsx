"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { approveEmployee } from "../actions";

type ApproveButtonProps = {
  employeeProfileId: string;
  onSuccess?: () => void;
};

export const ApproveButton = ({ employeeProfileId, onSuccess }: ApproveButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const onApprove = () => {
    startTransition(async () => {
      const result = await approveEmployee(employeeProfileId);
      if (result.success) onSuccess?.();
    });
  };

  return (
    <Button size="sm" onClick={onApprove} disabled={isPending}>
      {isPending ? "Approving..." : "Approve"}
    </Button>
  );
};
