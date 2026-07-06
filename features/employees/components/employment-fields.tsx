import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { EmployeeFormValues } from "../schema";

type EmploymentFieldsProps = {
  register: UseFormRegister<EmployeeFormValues>;
  control: Control<EmployeeFormValues>;
  errors: FieldErrors<EmployeeFormValues>;
};

export const EmploymentFields = ({ register, control, errors }: EmploymentFieldsProps) => (
  <div className="space-y-4">
    <h2 className="text-sm font-semibold text-muted-foreground">Employment details</h2>

    <div className="space-y-2">
      <Label htmlFor="position">Position</Label>
      <Input id="position" {...register("position")} />
    </div>

    <div className="space-y-2">
      <Label htmlFor="jobDescription">Job description</Label>
      <Textarea id="jobDescription" rows={3} {...register("jobDescription")} />
    </div>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="startDate">Start date</Label>
        <Input id="startDate" type="date" {...register("startDate")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate">End date</Label>
        <Input id="endDate" type="date" {...register("endDate")} />
        {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="salary">Monthly salary</Label>
        <Input id="salary" inputMode="decimal" {...register("salary")} />
        {errors.salary && <p className="text-sm text-destructive">{errors.salary.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="hourlyRate">Hourly rate</Label>
        <Input id="hourlyRate" inputMode="decimal" {...register("hourlyRate")} />
        {errors.hourlyRate && (
          <p className="text-sm text-destructive">{errors.hourlyRate.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="minHoursPerWeek">Min hours / week</Label>
        <Input id="minHoursPerWeek" inputMode="decimal" {...register("minHoursPerWeek")} />
        {errors.minHoursPerWeek && (
          <p className="text-sm text-destructive">{errors.minHoursPerWeek.message}</p>
        )}
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="accommodationCost">Accommodation cost</Label>
      <Input id="accommodationCost" inputMode="decimal" {...register("accommodationCost")} />
      {errors.accommodationCost && (
        <p className="text-sm text-destructive">{errors.accommodationCost.message}</p>
      )}
    </div>

    <Controller
      name="isStudent"
      control={control}
      render={({ field }) => (
        <Label className="flex w-fit items-center gap-2 font-normal">
          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          Student under 26 (ZUS-exempt)
        </Label>
      )}
    />
  </div>
);
