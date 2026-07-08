import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Employee } from "@/types/employee";

type EmployeeSummaryCardProps = {
  employee: Employee;
};

const Field = ({ label, value }: { label: string; value: ReactNode }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm break-all">{value}</p>
  </div>
);

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString() : "—");

const formatPay = (employee: Employee) => {
  if (employee.salary) return `${employee.salary} PLN / month`;
  if (employee.hourlyRate) return `${employee.hourlyRate} PLN / hour`;
  return "—";
};

export const EmployeeSummaryCard = ({ employee }: EmployeeSummaryCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Employee details</CardTitle>
    </CardHeader>
    <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Email" value={employee.email} />
      <Field label="Position" value={employee.position ?? "—"} />
      <Field label="Work basis" value={employee.workBasis ?? "—"} />
      <Field label="Pay" value={formatPay(employee)} />
      <Field label="Start date" value={formatDate(employee.startDate)} />
      <Field label="End date" value={formatDate(employee.endDate)} />
      <Field label="Nationality" value={employee.nationality ?? "—"} />
      <Field label="Address" value={employee.address ?? "—"} />
    </CardContent>
  </Card>
);
