import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ApproveButton } from "./approve-button";
import { RejectDialog } from "./reject-dialog";
import type { profiles } from "@/drizzle/schema";

type PendingEmployee = typeof profiles.$inferSelect;

type ApprovalsTableProps = {
  requests: PendingEmployee[];
};

export const ApprovalsTable = ({ requests }: ApprovalsTableProps) => {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No pending requests right now — new sign-ups will show up here.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Requested</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>{request.fullName ?? "—"}</TableCell>
            <TableCell>{request.email}</TableCell>
            <TableCell>{request.createdAt.toLocaleDateString()}</TableCell>
            <TableCell className="space-x-2 text-right">
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href={`/dashboard/approvals/${request.id}`} />}
              >
                View details
              </Button>
              <ApproveButton employeeProfileId={request.id} />
              <RejectDialog employeeProfileId={request.id} employeeName={request.fullName ?? request.email} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
