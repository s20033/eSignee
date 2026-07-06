"use client";

import { useState, useTransition } from "react";
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
import { deleteEmployee } from "../actions";

type DeleteEmployeeDialogProps = {
  employeeId: string;
  employeeName: string;
};

export const DeleteEmployeeDialog = ({
  employeeId,
  employeeName,
}: DeleteEmployeeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onConfirm = () => {
    startTransition(async () => {
      await deleteEmployee(employeeId);
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>Delete</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {employeeName}?</DialogTitle>
          <DialogDescription>
            This employee will be removed from your active list. This can be reversed by an
            administrator.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
