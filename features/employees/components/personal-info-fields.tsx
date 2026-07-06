import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmployeeFormValues } from "../schema";

type PersonalInfoFieldsProps = {
  register: UseFormRegister<EmployeeFormValues>;
  errors: FieldErrors<EmployeeFormValues>;
};

export const PersonalInfoFields = ({ register, errors }: PersonalInfoFieldsProps) => (
  <div className="space-y-4">
    <h2 className="text-sm font-semibold text-muted-foreground">Personal information</h2>

    <div className="space-y-2">
      <Label htmlFor="fullName">Full name</Label>
      <Input id="fullName" {...register("fullName")} />
      {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
    </div>

    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" {...register("email")} />
      {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
    </div>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="passportNumber">Passport number</Label>
        <Input id="passportNumber" {...register("passportNumber")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pesel">PESEL</Label>
        <Input id="pesel" maxLength={11} {...register("pesel")} />
        {errors.pesel && <p className="text-sm text-destructive">{errors.pesel.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nationality">Nationality</Label>
        <Input id="nationality" {...register("nationality")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...register("address")} />
      </div>
    </div>
  </div>
);
