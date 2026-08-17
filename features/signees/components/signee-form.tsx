"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSignee, updateSignee } from "../actions";
import { signeeFormSchema, emptySigneeFormValues, type SigneeFormValues } from "../schema";

type SigneeFormProps = {
  signeeId?: string;
  defaultValues?: SigneeFormValues;
};

export const SigneeForm = ({ signeeId, defaultValues }: SigneeFormProps) => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigneeFormValues>({
    resolver: zodResolver(signeeFormSchema),
    defaultValues: defaultValues ?? emptySigneeFormValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = signeeId ? await updateSignee(signeeId, values) : await createSignee(values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    router.push("/dashboard/signees");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
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

      <div className="space-y-2">
        <Label htmlFor="companyName">Company (optional)</Label>
        <Input id="companyName" {...register("companyName")} />
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {signeeId ? "Save changes" : "Add signee"}
      </Button>
    </form>
  );
};
