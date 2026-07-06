"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JOB_POSITIONS } from "@/lib/legal/job-positions";
import { generateContractBundle } from "../actions";
import { contractBuilderSchema, type ContractBuilderValues } from "../schema";

type ContractBuilderFormProps = {
  employeeId: string;
};

const defaultValues: ContractBuilderValues = {
  contractType: "zlecenie",
  positionId: "",
  customPositionName: "",
  customPositionDescription: "",
  startDate: "",
  endDate: "",
  hourlyRate: "",
  minHours: "",
  monthlyWage: "",
  weeklyHours: "",
  paymentMethod: "przelewem",
};

export const ContractBuilderForm = ({ employeeId }: ContractBuilderFormProps) => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<ContractBuilderValues>({
    resolver: zodResolver(contractBuilderSchema),
    defaultValues,
  });

  const contractType = watch("contractType");
  const positionId = watch("positionId");

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await generateContractBundle(employeeId, values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contractType">Contract type</Label>
        <Controller
          name="contractType"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="contractType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zlecenie">Umowa zlecenia (mandate contract)</SelectItem>
                <SelectItem value="o_prace">Umowa o pracę (employment contract)</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="positionId">Position (optional picker)</Label>
        <Controller
          name="positionId"
          control={control}
          render={({ field }) => (
            <Select value={field.value || "custom"} onValueChange={field.onChange}>
              <SelectTrigger id="positionId" className="w-full">
                <SelectValue placeholder="Custom position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom position (enter below)</SelectItem>
                {JOB_POSITIONS.map((position) => (
                  <SelectItem key={position.id} value={position.id}>
                    {position.namePl} ({position.nameEn})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {(!positionId || positionId === "custom") && (
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customPositionName">Position name</Label>
            <Input id="customPositionName" {...register("customPositionName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customPositionDescription">Position description</Label>
            <Input id="customPositionDescription" {...register("customPositionDescription")} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" type="date" {...register("endDate")} />
        </div>
      </div>

      {contractType === "zlecenie" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly rate (PLN gross)</Label>
            <Input id="hourlyRate" inputMode="decimal" {...register("hourlyRate")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minHours">Min hours / week</Label>
            <Input id="minHours" inputMode="decimal" {...register("minHours")} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="monthlyWage">Monthly wage (PLN gross)</Label>
            <Input id="monthlyWage" inputMode="decimal" {...register("monthlyWage")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weeklyHours">Weekly hours</Label>
            <Input id="weeklyHours" inputMode="decimal" {...register("weeklyHours")} />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Payment method</Label>
        <Input id="paymentMethod" {...register("paymentMethod")} />
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Generating..." : "Generate documents"}
      </Button>
    </form>
  );
};
