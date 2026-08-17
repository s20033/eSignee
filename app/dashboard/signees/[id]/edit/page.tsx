import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SigneeForm } from "@/features/signees/components/signee-form";
import { getSigneeById } from "@/features/signees/actions";

type EditSigneePageProps = {
  params: Promise<{ id: string }>;
};

const EditSigneePage = async ({ params }: EditSigneePageProps) => {
  const { id } = await params;
  const signee = await getSigneeById(id);

  if (!signee) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Signees", href: "/dashboard/signees" },
          { label: signee.fullName },
          { label: "Edit" },
        ]}
      />
      <h1 className="text-2xl font-semibold">Edit signee</h1>
      <SigneeForm
        signeeId={signee.id}
        defaultValues={{
          fullName: signee.fullName,
          email: signee.email,
          companyName: signee.companyName ?? "",
        }}
      />
    </div>
  );
};

export default EditSigneePage;
