"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignaturePad, type SignaturePadHandle } from "./signature-pad";
import { signAsEmployer } from "../actions";

type SignAsEmployerDialogProps = {
  documentId: string;
};

export const SignAsEmployerDialog = ({ documentId }: SignAsEmployerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signatureRef = useRef<SignaturePadHandle>(null);

  const onConfirm = async () => {
    setError(null);
    const signatureDataUrl = signatureRef.current?.getDataUrl();
    if (!signatureDataUrl) {
      setError("Please draw a signature.");
      return;
    }

    setSubmitting(true);
    const result = await signAsEmployer(documentId, signatureDataUrl);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>Sign</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign as employer</DialogTitle>
        </DialogHeader>
        <SignaturePad ref={signatureRef} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={submitting}>
            {submitting ? "Signing..." : "Confirm signature"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
