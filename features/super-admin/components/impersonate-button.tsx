"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { impersonateTenantAdmin } from "../actions";

type ImpersonateButtonProps = {
  tenantId: string;
};

export const ImpersonateButton = ({ tenantId }: ImpersonateButtonProps) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await impersonateTenantAdmin(tenantId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      window.open(result.link, "_blank", "noopener,noreferrer");
    });
  };

  return (
    <div className="space-y-1">
      <Button variant="outline" onClick={onClick} disabled={isPending}>
        {isPending ? "Generating link..." : "Impersonate admin"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
