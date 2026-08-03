"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, verifyMfaChallenge } from "../actions";
import { loginSchema, mfaCodeSchema, type LoginFormValues, type MfaCodeFormValues } from "../schema";

export const LoginForm = () => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mfaForm = useForm<MfaCodeFormValues>({
    resolver: zodResolver(mfaCodeSchema),
    defaultValues: { code: "" },
  });

  const onSubmitLogin = loginForm.handleSubmit(async (values) => {
    setServerError(null);
    const result = await signIn(values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    if (result.mfaRequired) {
      setMfaFactorId(result.factorId);
      return;
    }

    router.push(result.redirectTo);
    router.refresh();
  });

  const onSubmitMfa = mfaForm.handleSubmit(async (values) => {
    setServerError(null);
    if (!mfaFactorId) return;

    const result = await verifyMfaChallenge(mfaFactorId, values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    router.push(result.redirectTo);
    router.refresh();
  });

  if (mfaFactorId) {
    return (
      <form onSubmit={onSubmitMfa} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Two-factor code</Label>
          <Input id="code" inputMode="numeric" maxLength={6} {...mfaForm.register("code")} />
          {mfaForm.formState.errors.code && (
            <p className="text-sm text-destructive">{mfaForm.formState.errors.code.message}</p>
          )}
        </div>
        {serverError && <p className="text-sm text-destructive">{serverError}</p>}
        <Button type="submit" className="w-full" disabled={mfaForm.formState.isSubmitting}>
          Verify
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmitLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...loginForm.register("email")} />
        {loginForm.formState.errors.email && (
          <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs text-primary underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input id="password" type="password" {...loginForm.register("password")} />
        {loginForm.formState.errors.password && (
          <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
        Sign in
      </Button>
    </form>
  );
};
