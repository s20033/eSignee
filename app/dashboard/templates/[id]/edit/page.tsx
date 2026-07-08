import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { TemplateForm } from "@/features/templates/components/template-form";
import { getTemplateById } from "@/features/templates/actions";

type EditTemplatePageProps = {
  params: Promise<{ id: string }>;
};

const EditTemplatePage = async ({ params }: EditTemplatePageProps) => {
  const { id } = await params;
  const template = await getTemplateById(id);

  if (!template) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Templates", href: "/dashboard/templates" },
          { label: template.name },
          { label: "Edit" },
        ]}
      />
      <h1 className="text-2xl font-semibold">Edit template</h1>
      <TemplateForm
        templateId={template.id}
        defaultValues={{
          name: template.name,
          content: template.content,
          category: template.category,
          customCategoryLabel: template.customCategoryLabel ?? "",
        }}
      />
    </div>
  );
};

export default EditTemplatePage;
