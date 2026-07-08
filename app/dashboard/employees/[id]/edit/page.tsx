import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EmployeeForm } from "@/features/employees/components/employee-form";
import { getEmployeeById } from "@/features/employees/actions";

type EditEmployeePageProps = {
  params: Promise<{ id: string }>;
};

const EditEmployeePage = async ({ params }: EditEmployeePageProps) => {
  const { id } = await params;
  const employee = await getEmployeeById(id);

  if (!employee) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Employees", href: "/dashboard/employees" },
          { label: employee.fullName },
          { label: "Edit" },
        ]}
      />
      <h1 className="text-2xl font-semibold">Edit employee</h1>
      <EmployeeForm
        employeeId={employee.id}
        defaultValues={{
          fullName: employee.fullName,
          email: employee.email,
          position: employee.position ?? "",
          salary: employee.salary ?? "",
          startDate: employee.startDate ?? "",
          endDate: employee.endDate ?? "",
          passportNumber: employee.passportNumber ?? "",
          pesel: employee.pesel ?? "",
          nationality: employee.nationality ?? "",
          address: employee.address ?? "",
          bankName: employee.bankName ?? "",
          iban: employee.iban ?? "",
          jobDescription: employee.jobDescription ?? "",
          hourlyRate: employee.hourlyRate ?? "",
          minHoursPerWeek: employee.minHoursPerWeek ?? "",
          accommodationCost: employee.accommodationCost ?? "",
          isForeigner: employee.isForeigner,
          citizenship: employee.citizenship ?? "",
          foreignerDocumentType:
            (employee.foreignerDocumentType as "visa" | "residence_card" | "other" | null) ??
            undefined,
          foreignerDocumentNumber: employee.foreignerDocumentNumber ?? "",
          foreignerDocumentExpiry: employee.foreignerDocumentExpiry ?? "",
          workBasis: employee.workBasis ?? "",
          isStudent: employee.isStudent,
        }}
      />
    </div>
  );
};

export default EditEmployeePage;
