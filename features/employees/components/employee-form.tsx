"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { createEmployee, updateEmployee } from "../actions";
import { employeeFormSchema, emptyEmployeeFormValues, type EmployeeFormValues } from "../schema";
import { PersonalInfoFields } from "./personal-info-fields";
import { BankingFields } from "./banking-fields";
import { EmploymentFields } from "./employment-fields";
import { ForeignerStatusFields } from "./foreigner-status-fields";

type EmployeeFormProps = {
  employeeId?: string;
  defaultValues?: EmployeeFormValues;
};

export const EmployeeForm = ({ employeeId, defaultValues }: EmployeeFormProps) => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: defaultValues ?? emptyEmployeeFormValues,
  });

  const isForeigner = watch("isForeigner");

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = employeeId
      ? await updateEmployee(employeeId, values)
      : await createEmployee(values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    router.push("/dashboard/employees");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-8">
      <PersonalInfoFields register={register} errors={errors} />
      <BankingFields register={register} errors={errors} />
      <EmploymentFields register={register} control={control} errors={errors} />
      <ForeignerStatusFields
        register={register}
        control={control}
        errors={errors}
        isForeigner={isForeigner}
      />

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {employeeId ? "Save changes" : "Create employee"}
      </Button>
    </form>
  );
};
