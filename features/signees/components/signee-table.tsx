import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DeleteSigneeDialog } from "./delete-signee-dialog";
import type { Signee } from "@/types/signee";

type SigneeTableProps = {
  signees: Signee[];
};

export const SigneeTable = ({ signees }: SigneeTableProps) => {
  if (signees.length === 0) {
    return <p className="text-sm text-muted-foreground">No signees found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Company</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {signees.map((signee) => (
          <TableRow key={signee.id}>
            <TableCell>{signee.fullName}</TableCell>
            <TableCell>{signee.email}</TableCell>
            <TableCell>{signee.companyName ?? "—"}</TableCell>
            <TableCell className="space-x-2 text-right">
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href={`/dashboard/signees/${signee.id}/edit`} />}
              >
                Edit
              </Button>
              <DeleteSigneeDialog signeeId={signee.id} signeeName={signee.fullName} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
