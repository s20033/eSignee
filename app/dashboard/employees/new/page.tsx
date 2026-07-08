import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EmployeeForm } from "@/features/employees/components/employee-form";

const NewEmployeePage = () => (
  <div className="space-y-6">
    <Breadcrumbs items={[{ label: "Employees", href: "/dashboard/employees" }, { label: "Add employee" }]} />
    <h1 className="text-2xl font-semibold">Add employee</h1>
    <EmployeeForm />
  </div>
);

export default NewEmployeePage;
