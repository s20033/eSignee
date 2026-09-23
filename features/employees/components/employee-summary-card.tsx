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

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="space-y-3">
    <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
  </div>
);

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString() : "—");

// English labels, matching the Select options in foreigner-status-fields.tsx —
// lib/legal/constants.ts's FOREIGNER_DOCUMENT_LABELS is Polish, meant for the
// generated PDF's legal text, not this English-UI summary view.
const FOREIGNER_DOCUMENT_LABELS: Record<string, string> = {
  visa: "Visa",
  residence_card: "Residence card",
  other: "Other",
};

/** Read-only mirror of every field employee-form.tsx collects, grouped the same way (personal / employment / banking / foreigner status). */
export const EmployeeSummaryCard = ({ employee }: EmployeeSummaryCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Employee details</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <Section title="Personal information">
        <Field label="Full name" value={employee.fullName} />
        <Field label="Email" value={employee.email} />
        <Field label="Passport number" value={employee.passportNumber ?? "—"} />
        <Field label="PESEL" value={employee.pesel ?? "—"} />
        <Field label="Nationality" value={employee.nationality ?? "—"} />
        <Field label="Address" value={employee.address ?? "—"} />
      </Section>

      <Section title="Employment details">
        <Field label="Position" value={employee.position ?? "—"} />
        <Field label="Job description" value={employee.jobDescription ?? "—"} />
        <Field label="Start date" value={formatDate(employee.startDate)} />
        <Field label="End date" value={formatDate(employee.endDate)} />
        <Field label="Monthly salary" value={employee.salary ? `${employee.salary} PLN / month` : "—"} />
        <Field label="Hourly rate" value={employee.hourlyRate ? `${employee.hourlyRate} PLN / hour` : "—"} />
        <Field label="Min hours / week" value={employee.minHoursPerWeek ?? "—"} />
        <Field label="Accommodation cost" value={employee.accommodationCost ? `${employee.accommodationCost} PLN` : "—"} />
        <Field label="Student (ZUS-exempt)" value={employee.isStudent ? "Yes" : "No"} />
      </Section>

      <Section title="Banking information">
        <Field label="Bank name" value={employee.bankName ?? "—"} />
        <Field label="IBAN" value={employee.iban ?? "—"} />
      </Section>

      <Section title="Foreigner status">
        <Field label="Foreign national" value={employee.isForeigner ? "Yes" : "No"} />
        {employee.isForeigner && (
          <>
            <Field label="Citizenship" value={employee.citizenship ?? "—"} />
            <Field
              label="Document type"
              value={
                employee.foreignerDocumentType
                  ? (FOREIGNER_DOCUMENT_LABELS[employee.foreignerDocumentType] ?? employee.foreignerDocumentType)
                  : "—"
              }
            />
            <Field label="Document number" value={employee.foreignerDocumentNumber ?? "—"} />
            <Field label="Document expiry" value={formatDate(employee.foreignerDocumentExpiry)} />
            <Field label="Work basis" value={employee.workBasis ?? "—"} />
          </>
        )}
      </Section>
    </CardContent>
  </Card>
);
