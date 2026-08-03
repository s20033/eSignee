"use client";

import { useState } from "react";
import { useForm, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emptyEmployeeFormValues, type EmployeeFormValues } from "@/features/employees/schema";
import { PersonalInfoFields } from "@/features/employees/components/personal-info-fields";
import { BankingFields } from "@/features/employees/components/banking-fields";
import { EmploymentFields } from "@/features/employees/components/employment-fields";
import { ForeignerStatusFields } from "@/features/employees/components/foreigner-status-fields";
import { registerEmployee } from "../actions";
import { registerEmployeeSchema, type RegisterEmployeeFormValues } from "../schema";

type RegisterEmployeeFormProps = {
  inviteCode: string;
};

const emptyValues: RegisterEmployeeFormValues = {
  ...emptyEmployeeFormValues,
  password: "",
  confirmPassword: "",
};

export const RegisterEmployeeForm = ({ inviteCode }: RegisterEmployeeFormProps) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterEmployeeFormValues>({
    resolver: zodResolver(registerEmployeeSchema),
    defaultValues: emptyValues,
  });

  const isForeigner = watch("isForeigner");

  // RegisterEmployeeFormValues is employeeFormSchema's shape plus password
  // fields — a strict superset at runtime, but react-hook-form's Control/
  // FormState types are invariant in TFieldValues, so passing them into
  // components typed for the narrower EmployeeFormValues needs an explicit
  // (structurally sound) cast rather than failing to compile.
  const employeeRegister = register as unknown as UseFormRegister<EmployeeFormValues>;
  const employeeControl = control as unknown as Control<EmployeeFormValues>;
  const employeeErrors = errors as FieldErrors<EmployeeFormValues>;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await registerEmployee(inviteCode, values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    setSubmitted(true);
  });

  if (submitted) {
    return (
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium">Request sent.</p>
        <p className="text-sm text-muted-foreground">
          Your employer needs to approve your account before you can sign in. We&apos;ll email you
          once that happens.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <PersonalInfoFields register={employeeRegister} errors={employeeErrors} />

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Account</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>
      </div>

      <EmploymentFields register={employeeRegister} control={employeeControl} errors={employeeErrors} />
      <BankingFields register={employeeRegister} errors={employeeErrors} />
      <ForeignerStatusFields
        register={employeeRegister}
        control={employeeControl}
        errors={employeeErrors}
        isForeigner={isForeigner}
      />

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Request access
      </Button>
    </form>
  );
};
