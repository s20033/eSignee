"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TENANT_PLANS, type TenantPlan } from "@/lib/billing/plans";
import { updateTenantPlan } from "../actions";

type PlanSelectorProps = {
  tenantId: string;
  plan: string;
};

export const PlanSelector = ({ tenantId, plan }: PlanSelectorProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onChange = (value: string | null) => {
    if (!value) return;
    startTransition(async () => {
      await updateTenantPlan(tenantId, { plan: value as TenantPlan });
      router.refresh();
    });
  };

  return (
    <Select value={plan} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="w-36 capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TENANT_PLANS.map((value) => (
          <SelectItem key={value} value={value} className="capitalize">
            {value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
