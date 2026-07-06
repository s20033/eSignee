import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmployeeFormValues } from "../schema";

type BankingFieldsProps = {
  register: UseFormRegister<EmployeeFormValues>;
  errors: FieldErrors<EmployeeFormValues>;
};

export const BankingFields = ({ register, errors }: BankingFieldsProps) => (
  <div className="space-y-4">
    <h2 className="text-sm font-semibold text-muted-foreground">Banking information</h2>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="bankName">Bank name</Label>
        <Input id="bankName" {...register("bankName")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="iban">IBAN</Label>
        <Input id="iban" placeholder="PL61109010140000071219812874" {...register("iban")} />
        {errors.iban && <p className="text-sm text-destructive">{errors.iban.message}</p>}
      </div>
    </div>
  </div>
);
