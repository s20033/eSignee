import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import { ContractBuilderForm } from "@/features/documents/components/contract-builder-form";
import { GenerateFromTemplateForm } from "@/features/documents/components/generate-from-template-form";
import { DocumentBundleList } from "@/features/documents/components/document-bundle-list";
import { AuditTrail } from "@/features/documents/components/audit-trail";
import { EmployeeSummaryCard } from "@/features/employees/components/employee-summary-card";
import { listDocumentAuditLog, listDocumentBundles } from "@/features/documents/actions";
import { listTemplatesForPicker } from "@/features/templates/actions";
import { getEmployeeById } from "@/features/employees/actions";

type EmployeeDocumentsPageProps = {
  params: Promise<{ id: string }>;
};

const EmployeeDocumentsPage = async ({ params }: EmployeeDocumentsPageProps) => {
  const { id } = await params;
  const employee = await getEmployeeById(id);

  if (!employee) {
    notFound();
  }

  const [bundles, auditEntries, templates] = await Promise.all([
    listDocumentBundles(id),
    listDocumentAuditLog(id),
    listTemplatesForPicker(),
  ]);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: "Employees", href: "/dashboard/employees" }, { label: employee.fullName }]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{employee.fullName}</h1>
          <p className="text-sm text-muted-foreground">
            {employee.position ?? "No position set"} · {employee.email}
          </p>
          {(employee.isForeigner || employee.isStudent) && (
            <div className="flex gap-2 pt-1">
              {employee.isForeigner && <Badge variant="outline">Foreigner</Badge>}
              {employee.isStudent && <Badge variant="secondary">Student</Badge>}
            </div>
          )}
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/dashboard/employees/${id}/edit`} />}
        >
          Edit employee
        </Button>
      </div>

      <EmployeeSummaryCard employee={employee} />

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTab value="documents">Documents</TabsTab>
          <TabsTab value="activity">Activity</TabsTab>
          <TabsTab value="new-contract">New contract</TabsTab>
          <TabsTab value="from-template">From template</TabsTab>
        </TabsList>
        <TabsPanel value="documents">
          <DocumentBundleList bundles={bundles} />
        </TabsPanel>
        <TabsPanel value="activity">
          <AuditTrail entries={auditEntries} />
        </TabsPanel>
        <TabsPanel value="new-contract">
          <ContractBuilderForm employeeId={id} />
        </TabsPanel>
        <TabsPanel value="from-template">
          <GenerateFromTemplateForm employeeId={id} templates={templates} />
        </TabsPanel>
      </Tabs>
    </div>
  );
};

export default EmployeeDocumentsPage;
