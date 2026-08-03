"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { rejectEmployeeSchema, type RejectEmployeeFormValues } from "@/features/auth/schema";
import { rejectEmployee } from "../actions";

type RejectDialogProps = {
  employeeProfileId: string;
  employeeName: string;
  onSuccess?: () => void;
};

export const RejectDialog = ({ employeeProfileId, employeeName, onSuccess }: RejectDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectEmployeeFormValues>({
    resolver: zodResolver(rejectEmployeeSchema),
    defaultValues: { reason: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await rejectEmployee(employeeProfileId, values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      reset();
      setOpen(false);
      onSuccess?.();
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>Reject</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject {employeeName}?</DialogTitle>
          <DialogDescription>
            They&apos;ll receive an email with the reason you give below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Textarea id="reason" {...register("reason")} />
          {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
