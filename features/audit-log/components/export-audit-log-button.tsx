"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exportAuditLogMonthCsv } from "../actions";

const currentMonth = () => new Date().toISOString().slice(0, 7);

export const ExportAuditLogButton = () => {
  const [month, setMonth] = useState(currentMonth());
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const csv = await exportAuditLogMonthCsv(month);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-log-${month}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="month"
        value={month}
        onChange={(event) => setMonth(event.target.value)}
        max={currentMonth()}
        className="w-40"
        aria-label="Month to export"
      />
      <Button variant="outline" onClick={onClick} disabled={isPending || !month}>
        {isPending ? "Exporting..." : "Export month"}
      </Button>
    </div>
  );
};
