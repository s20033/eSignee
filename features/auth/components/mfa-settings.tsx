"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enrollMfa, unenrollMfa, verifyMfaEnrollment } from "../mfa-actions";
import { mfaCodeSchema, type MfaCodeFormValues } from "../schema";

type Factor = { id: string; friendlyName?: string };

type MfaSettingsProps = {
  factors: Factor[];
};

export const MfaSettings = ({ factors }: MfaSettingsProps) => {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<{ factorId: string; qrCode: string; secret: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<MfaCodeFormValues>({
    resolver: zodResolver(mfaCodeSchema),
    defaultValues: { code: "" },
  });

  const onEnroll = async () => {
    setError(null);
    const result = await enrollMfa();
    if (!result.success) {
      setError(result.error);
      return;
    }
    setEnrollment(result);
  };

  const onVerify = handleSubmit(async (values) => {
    if (!enrollment) return;
    setError(null);
    const result = await verifyMfaEnrollment(enrollment.factorId, values);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setEnrollment(null);
    router.refresh();
  });

  const onRemove = async (factorId: string) => {
    await unenrollMfa(factorId);
    router.refresh();
  };

  if (factors.length > 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm">Two-factor authentication is enabled.</p>
        {factors.map((factor) => (
          <Button key={factor.id} variant="outline" size="sm" onClick={() => onRemove(factor.id)}>
            Disable 2FA
          </Button>
        ))}
      </div>
    );
  }

  if (enrollment) {
    return (
      <form onSubmit={onVerify} className="max-w-sm space-y-4">
        <p className="text-sm text-muted-foreground">
          Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.
        </p>
        <div
          className="w-fit rounded-lg border p-2"
          // Trusted markup generated server-side by Supabase, not user input.
          dangerouslySetInnerHTML={{ __html: enrollment.qrCode }}
        />
        <p className="text-xs text-muted-foreground">Manual entry key: {enrollment.secret}</p>
        <div className="space-y-2">
          <Label htmlFor="code">6-digit code</Label>
          <Input id="code" inputMode="numeric" maxLength={6} {...register("code")} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={isSubmitting}>
          Confirm
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Add an extra layer of security with an authenticator app.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button variant="outline" size="sm" onClick={onEnroll}>
        Enable 2FA
      </Button>
    </div>
  );
};
