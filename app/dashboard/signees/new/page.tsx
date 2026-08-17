import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SigneeForm } from "@/features/signees/components/signee-form";

const NewSigneePage = () => (
  <div className="space-y-6">
    <Breadcrumbs items={[{ label: "Signees", href: "/dashboard/signees" }, { label: "Add signee" }]} />
    <h1 className="text-2xl font-semibold">Add signee</h1>
    <SigneeForm />
  </div>
);

export default NewSigneePage;
