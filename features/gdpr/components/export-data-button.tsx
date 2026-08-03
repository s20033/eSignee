"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { exportTenantData } from "../actions";

export const ExportDataButton = () => {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const json = await exportTenantData();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `esignee-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <Button variant="outline" onClick={onClick} disabled={isPending}>
      {isPending ? "Exporting..." : "Export all data (JSON)"}
    </Button>
  );
};
