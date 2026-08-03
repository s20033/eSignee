"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateTenantStatus } from "../actions";
import type { TenantStatusValue } from "../schema";

type StatusToggleProps = {
  tenantId: string;
  status: TenantStatusValue;
};

export const StatusToggle = ({ tenantId, status }: StatusToggleProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const next: TenantStatusValue = status === "active" ? "suspended" : "active";

  const onClick = () => {
    if (next === "suspended" && !window.confirm("Suspend this tenant? Their admins and employees will be blocked from the dashboard/portal immediately.")) {
      return;
    }
    startTransition(async () => {
      await updateTenantStatus(tenantId, next);
      router.refresh();
    });
  };

  return (
    <Button variant={status === "active" ? "destructive" : "outline"} size="sm" onClick={onClick} disabled={isPending}>
      {isPending ? "Updating..." : status === "active" ? "Suspend tenant" : "Reactivate tenant"}
    </Button>
  );
};
