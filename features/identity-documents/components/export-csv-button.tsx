"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { exportIdentityDocumentsCsv } from "../actions";

export const ExportCsvButton = () => {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const csv = await exportIdentityDocumentsCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `identity-documents-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <Button variant="outline" onClick={onClick} disabled={isPending}>
      {isPending ? "Exporting..." : "Export CSV"}
    </Button>
  );
};
