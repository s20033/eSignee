import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { IDENTITY_DOCUMENT_TYPE_LABELS } from "../schema";
import type { listAllIdentityDocuments } from "../actions";

type ComplianceRow = Awaited<ReturnType<typeof listAllIdentityDocuments>>[number];

type ComplianceTableProps = {
  rows: ComplianceRow[];
};

const STATUS_BADGE: Record<ComplianceRow["verificationStatus"], { label: string; variant: "secondary" | "default" | "destructive" }> = {
  pending_review: { label: "Pending review", variant: "secondary" },
  verified: { label: "Verified", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

const daysUntil = (dateString: string) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return Math.ceil((new Date(dateString).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const ComplianceTable = ({ rows }: ComplianceTableProps) => {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No identity documents on file yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Document number</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const status = STATUS_BADGE[row.verificationStatus];
          const remaining = row.expiryDate ? daysUntil(row.expiryDate) : null;
          const isUrgent = remaining !== null && remaining <= 30;

          return (
            <TableRow key={row.id}>
              <TableCell>{row.employeeName}</TableCell>
              <TableCell>{IDENTITY_DOCUMENT_TYPE_LABELS[row.type]}</TableCell>
              <TableCell>{row.documentNumber ?? "—"}</TableCell>
              <TableCell className={cn(isUrgent && "font-medium text-destructive")}>
                {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : "—"}
                {remaining !== null && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({remaining < 0 ? "expired" : `${remaining}d`})
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
