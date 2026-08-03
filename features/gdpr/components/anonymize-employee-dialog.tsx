"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { anonymizeEmployee } from "../actions";

type AnonymizeEmployeeDialogProps = {
  employeeId: string;
  employeeName: string;
};

const CONFIRM_TEXT = "ERASE";

export const AnonymizeEmployeeDialog = ({ employeeId, employeeName }: AnonymizeEmployeeDialogProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await anonymizeEmployee(employeeId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push("/dashboard/employees");
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirmText("");
      }}
    >
      <DialogTrigger render={<Button variant="destructive" />}>Anonymize (GDPR erasure)</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anonymize {employeeName}?</DialogTitle>
          <DialogDescription>
            Permanently removes their name, contact details, and government ID numbers, disables their portal
            login, and removes their uploaded identity documents. Signed documents and the audit trail are kept
            for legal record-keeping. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirmText">
            Type <span className="font-mono font-semibold">{CONFIRM_TEXT}</span> to confirm
          </Label>
          <Input id="confirmText" value={confirmText} onChange={(event) => setConfirmText(event.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={confirmText !== CONFIRM_TEXT || isPending} onClick={onConfirm}>
            {isPending ? "Anonymizing..." : "Anonymize permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
