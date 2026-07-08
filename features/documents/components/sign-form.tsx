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
  companyName: string;
};

export const SignForm = ({ token, companyName }: SignFormProps) => {
  const router = useRouter();
  const signatureRef = useRef<SignaturePadHandle>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    setError(null);
    const signatureDataUrl = await signatureRef.current?.getDataUrl();

    if (!consent) {
      setError("You must consent to data processing to sign.");
      return;
    }
    if (!signatureDataUrl) {
      setError("Please provide your signature above.");
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
        {/* Label is `display: flex` (for the common icon+short-text case) — a single wrapping
            span keeps this multi-line paragraph as one flex item so it wraps normally instead of
            the nested <strong> becoming its own column. */}
        <Label className="font-normal leading-snug text-sm">
          <span className="block">
            I consent to signing this document electronically (Art. 6(1)(a) GDPR/RODO). The data
            controller, <strong>{companyName}</strong>, processes the personal data contained in
            this document to conclude and perform this agreement (Art. 6(1)(b) GDPR/RODO). I have
            the right to access, rectify, or restrict processing of my data, and to lodge a
            complaint with the Polish data protection authority (UODO) or my local supervisory
            authority.
          </span>
        </Label>
      </div>

      <div className="space-y-2">
        <Label>Your signature</Label>
        <SignaturePad ref={signatureRef} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={onSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Sign document"}
      </Button>
    </div>
  );
};
