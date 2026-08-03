import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { listTenants } from "../actions";

type TenantRow = Awaited<ReturnType<typeof listTenants>>[number];

type TenantsTableProps = {
  tenants: TenantRow[];
};

export const TenantsTable = ({ tenants }: TenantsTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Tenant</TableHead>
        <TableHead>Admin</TableHead>
        <TableHead>Plan</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Employees</TableHead>
        <TableHead>Documents</TableHead>
        <TableHead>Created</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {tenants.map((tenant) => (
        <TableRow key={tenant.id}>
          <TableCell>
            <Link href={`/super-admin/tenants/${tenant.id}`} className="font-medium hover:underline">
              {tenant.name}
            </Link>
          </TableCell>
          <TableCell>{tenant.adminEmail ?? "—"}</TableCell>
          <TableCell className="capitalize">{tenant.plan}</TableCell>
          <TableCell>
            <Badge variant={tenant.status === "active" ? "default" : "destructive"}>{tenant.status}</Badge>
          </TableCell>
          <TableCell>{tenant.employeeCount}</TableCell>
          <TableCell>{tenant.documentCount}</TableCell>
          <TableCell>{tenant.createdAt.toLocaleDateString()}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
