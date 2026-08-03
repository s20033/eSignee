"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCompanySettings } from "../actions";
import { companySettingsSchema, type CompanySettingsValues } from "../schema";

type CompanySettingsFormProps = {
  defaultValues: CompanySettingsValues;
};

export const CompanySettingsForm = ({ defaultValues }: CompanySettingsFormProps) => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanySettingsValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSaved(false);
    const result = await updateCompanySettings(values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    setSaved(true);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company name</Label>
        <Input id="companyName" {...register("companyName")} />
        {errors.companyName && (
          <p className="text-sm text-destructive">{errors.companyName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...register("address")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultSigningPlace">Signing place (shown on contracts)</Label>
        <Input id="defaultSigningPlace" {...register("defaultSigningPlace")} />
        {errors.defaultSigningPlace && (
          <p className="text-sm text-destructive">{errors.defaultSigningPlace.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="taxId">Tax ID (NIP)</Label>
          <Input id="taxId" {...register("taxId")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="regon">REGON</Label>
          <Input id="regon" {...register("regon")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="krs">KRS</Label>
          <Input id="krs" {...register("krs")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input id="logoUrl" placeholder="https://..." {...register("logoUrl")} />
        {errors.logoUrl && <p className="text-sm text-destructive">{errors.logoUrl.message}</p>}
      </div>

      <Controller
        name="notifyOnSignatureNeeded"
        control={control}
        render={({ field }) => (
          <Label className="flex w-fit items-center gap-2 font-normal">
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            Email me when a document is ready for my signature
          </Label>
        )}
      />

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      {saved && <p className="text-sm text-muted-foreground">Saved.</p>}

      <Button type="submit" disabled={isSubmitting}>
        Save changes
      </Button>
    </form>
  );
};
