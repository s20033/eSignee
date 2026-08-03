"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useRowSelection } from "@/hooks/use-row-selection";
import { ACTION_LABELS } from "@/lib/audit/action-labels";
import { BulkDeleteAuditLogsDialog } from "./bulk-delete-audit-logs-dialog";
import type { listTenantAuditLog } from "@/lib/audit/log";

type AuditLogEntry = Awaited<ReturnType<typeof listTenantAuditLog>>["entries"][number];

type AuditLogTableProps = {
  entries: AuditLogEntry[];
};

export const AuditLogTable = ({ entries }: AuditLogTableProps) => {
  const entryIds = entries.map((entry) => entry.id);
  const selection = useRowSelection(entryIds);

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <div className="space-y-3">
      {selection.count > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2">
          <p className="text-sm text-muted-foreground">{selection.count} selected</p>
          <BulkDeleteAuditLogsDialog entryIds={selection.selectedIds} onDeleted={selection.clear} />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={selection.allSelected}
                onCheckedChange={(checked) => selection.toggleAll(checked === true)}
                aria-label="Select all entries"
              />
            </TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Document</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                <Checkbox
                  checked={selection.isSelected(entry.id)}
                  onCheckedChange={(checked) => selection.toggle(entry.id, checked === true)}
                  aria-label={`Select entry from ${entry.createdAt.toLocaleString()}`}
                />
              </TableCell>
              <TableCell>{ACTION_LABELS[entry.action] ?? entry.action}</TableCell>
              <TableCell>{entry.documentTitle ?? "—"}</TableCell>
              <TableCell>{entry.actorEmail ?? "System"}</TableCell>
              <TableCell>{entry.createdAt.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
