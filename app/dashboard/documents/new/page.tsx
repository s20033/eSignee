import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { GenerateForSigneeForm } from "@/features/documents/components/generate-for-signee-form";
import { listAllSignees } from "@/features/signees/actions";
import { listTemplatesForPicker } from "@/features/templates/actions";

const NewDocumentForSigneePage = async () => {
  const [signeeRows, templates] = await Promise.all([listAllSignees(), listTemplatesForPicker()]);

  const signees = signeeRows.map((signee) => ({
    id: signee.id,
    label: signee.companyName ? `${signee.fullName} — ${signee.companyName}` : signee.fullName,
  }));

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Documents", href: "/dashboard/documents" }, { label: "New for a signee" }]} />
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">New document for a signee</h1>
        <p className="text-sm text-muted-foreground">
          Send a document to someone outside your employee list — another company or an individual. Don&apos;t see
          them yet? <Link href="/dashboard/signees/new" className="underline">Add a signee</Link> first.
        </p>
      </div>
      <GenerateForSigneeForm signees={signees} templates={templates} />
    </div>
  );
};

export default NewDocumentForSigneePage;
