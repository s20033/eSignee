import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EmployeeFormValues } from "../schema";

type ForeignerStatusFieldsProps = {
  register: UseFormRegister<EmployeeFormValues>;
  control: Control<EmployeeFormValues>;
  errors: FieldErrors<EmployeeFormValues>;
  isForeigner: boolean;
};

export const ForeignerStatusFields = ({
  register,
  control,
  errors,
  isForeigner,
}: ForeignerStatusFieldsProps) => (
  <div className="space-y-4">
    <h2 className="text-sm font-semibold text-muted-foreground">Foreigner status</h2>

    <Controller
      name="isForeigner"
      control={control}
      render={({ field }) => (
        <Label className="flex w-fit items-center gap-2 font-normal">
          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          This employee is a foreign national
        </Label>
      )}
    />

    {isForeigner && (
      <div className="grid grid-cols-1 gap-4 border-l-2 pl-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="citizenship">Citizenship</Label>
          <Input id="citizenship" {...register("citizenship")} />
          {errors.citizenship && (
            <p className="text-sm text-destructive">{errors.citizenship.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="foreignerDocumentType">Document type</Label>
          <Controller
            name="foreignerDocumentType"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="foreignerDocumentType" className="w-full">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="residence_card">Residence card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="foreignerDocumentNumber">Document number</Label>
          <Input id="foreignerDocumentNumber" {...register("foreignerDocumentNumber")} />
          {errors.foreignerDocumentNumber && (
            <p className="text-sm text-destructive">
              {errors.foreignerDocumentNumber.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="foreignerDocumentExpiry">Document expiry date</Label>
          <Input id="foreignerDocumentExpiry" type="date" {...register("foreignerDocumentExpiry")} />
          {errors.foreignerDocumentExpiry && (
            <p className="text-sm text-destructive">
              {errors.foreignerDocumentExpiry.message}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="workBasis">Work basis</Label>
          <Input id="workBasis" placeholder="e.g. Work permit type A" {...register("workBasis")} />
          {errors.workBasis && (
            <p className="text-sm text-destructive">{errors.workBasis.message}</p>
          )}
        </div>
      </div>
    )}
  </div>
);
