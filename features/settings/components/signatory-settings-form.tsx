"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSignatorySettings } from "../actions";
import { signatorySettingsSchema, type SignatorySettingsValues } from "../schema";

type SignatorySettingsFormProps = {
  defaultValues: SignatorySettingsValues;
};

export const SignatorySettingsForm = ({ defaultValues }: SignatorySettingsFormProps) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignatorySettingsValues>({
    resolver: zodResolver(signatorySettingsSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSaved(false);
    const result = await updateSignatorySettings(values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    setSaved(true);
  });

  return (
    <Card className="max-w-md space-y-4 p-4">
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">Signatory</h2>
        <p className="text-sm text-muted-foreground">
          Shown on generated contracts in place of just the company name. Leave blank to keep using the
          company name only.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="signatoryName">Signatory name</Label>
            <Input id="signatoryName" {...register("signatoryName")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signatoryTitle">Signatory title</Label>
            <Input id="signatoryTitle" placeholder="e.g. Managing Director" {...register("signatoryTitle")} />
          </div>
        </div>

        {errors.signatoryName && <p className="text-sm text-destructive">{errors.signatoryName.message}</p>}
        {serverError && <p className="text-sm text-destructive">{serverError}</p>}
        {saved && <p className="text-sm text-muted-foreground">Saved.</p>}

        <Button type="submit" disabled={isSubmitting}>
          Save changes
        </Button>
      </form>
    </Card>
  );
};
