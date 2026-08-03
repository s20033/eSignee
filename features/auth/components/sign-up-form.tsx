"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TENANT_PLANS, TENANT_PLAN_LABELS } from "@/lib/billing/plans";
import { signUp } from "../actions";
import { signUpSchema, type SignUpFormValues } from "../schema";

export const SignUpForm = () => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { companyName: "", email: "", password: "", confirmPassword: "", plan: "free" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await signUp(values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setConfirmationSent(true);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  });

  if (confirmationSent) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Check your email to confirm your account, then sign in.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company name</Label>
        <Input id="companyName" {...register("companyName")} />
        {errors.companyName && (
          <p className="text-sm text-destructive">{errors.companyName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan">Plan</Label>
        <Controller
          name="plan"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={(value) => value && field.onChange(value)}>
              <SelectTrigger id="plan" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TENANT_PLANS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {TENANT_PLAN_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Create account
      </Button>
    </form>
  );
};
