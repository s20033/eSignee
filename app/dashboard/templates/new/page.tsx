import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { TemplateForm } from "@/features/templates/components/template-form";

const NewTemplatePage = () => (
  <div className="space-y-6">
    <Breadcrumbs items={[{ label: "Templates", href: "/dashboard/templates" }, { label: "Add template" }]} />
    <h1 className="text-2xl font-semibold">Add template</h1>
    <TemplateForm />
  </div>
);

export default NewTemplatePage;
