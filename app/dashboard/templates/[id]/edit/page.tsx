import { notFound } from "next/navigation";
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
      <h1 className="text-2xl font-semibold">Edit template</h1>
      <TemplateForm
        templateId={template.id}
        defaultValues={{ name: template.name, content: template.content }}
      />
    </div>
  );
};

export default EditTemplatePage;
