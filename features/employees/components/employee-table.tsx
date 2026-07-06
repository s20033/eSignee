import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DeleteEmployeeDialog } from "./delete-employee-dialog";
import type { Employee } from "@/types/employee";

type EmployeeTableProps = {
  employees: Employee[];
};

export const EmployeeTable = ({ employees }: EmployeeTableProps) => {
  if (employees.length === 0) {
    return <p className="text-sm text-muted-foreground">No employees found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Start date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell>{employee.fullName}</TableCell>
            <TableCell>{employee.email}</TableCell>
            <TableCell>{employee.position ?? "—"}</TableCell>
            <TableCell>{employee.startDate ?? "—"}</TableCell>
            <TableCell className="space-x-2 text-right">
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href={`/dashboard/employees/${employee.id}/documents`} />}
              >
                Documents
              </Button>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href={`/dashboard/employees/${employee.id}/edit`} />}
              >
                Edit
              </Button>
              <DeleteEmployeeDialog employeeId={employee.id} employeeName={employee.fullName} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
