import { notFound } from "next/navigation";
import { ContractBuilderForm } from "@/features/documents/components/contract-builder-form";
import { GenerateFromTemplateForm } from "@/features/documents/components/generate-from-template-form";
import { DocumentBundleList } from "@/features/documents/components/document-bundle-list";
import { AuditTrail } from "@/features/documents/components/audit-trail";
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Documents — {employee.fullName}</h1>
        <p className="text-sm text-muted-foreground">
          Generate a contract bundle and download the resulting PDFs.
        </p>
      </div>

      <ContractBuilderForm employeeId={id} />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Generate from a template</h2>
        <GenerateFromTemplateForm employeeId={id} templates={templates} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Generated bundles</h2>
        <DocumentBundleList bundles={bundles} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Activity</h2>
        <AuditTrail entries={auditEntries} />
      </div>
    </div>
  );
};

export default EmployeeDocumentsPage;
