"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SignaturePad, type SignaturePadHandle } from "./signature-pad";
import { submitEmployeeSignature } from "../signing-actions";

type SignFormProps = {
  token: string;
};

export const SignForm = ({ token }: SignFormProps) => {
  const router = useRouter();
  const signatureRef = useRef<SignaturePadHandle>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    setError(null);
    const signatureDataUrl = signatureRef.current?.getDataUrl();

    if (!consent) {
      setError("You must consent to data processing to sign.");
      return;
    }
    if (!signatureDataUrl) {
      setError("Please draw your signature above.");
      return;
    }

    setSubmitting(true);
    const result = await submitEmployeeSignature(token, signatureDataUrl, consent);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setDone(true);
    router.refresh();
  };

  if (done) {
    return (
      <div className="rounded-lg border bg-muted/30 p-6 text-center">
        <p className="font-medium">Thank you — your signature has been recorded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg border p-4">
        <Checkbox checked={consent} onCheckedChange={(value) => setConsent(value === true)} />
        <Label className="font-normal leading-snug">
          I consent to the processing of my personal data contained in this document by the
          employer, for the purpose of concluding and performing this agreement, in accordance
          with GDPR (Regulation (EU) 2016/679). I understand I may withdraw this consent at any
          time where processing is based on consent.
        </Label>
      </div>

      <div className="space-y-2">
        <Label>Draw your signature</Label>
        <SignaturePad ref={signatureRef} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={onSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Sign document"}
      </Button>
    </div>
  );
};
