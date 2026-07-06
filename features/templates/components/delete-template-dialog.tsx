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
import { deleteTemplate } from "../actions";

type DeleteTemplateDialogProps = {
  templateId: string;
  templateName: string;
};

export const DeleteTemplateDialog = ({
  templateId,
  templateName,
}: DeleteTemplateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onConfirm = () => {
    startTransition(async () => {
      await deleteTemplate(templateId);
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>Delete</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {templateName}?</DialogTitle>
          <DialogDescription>
            This template will be removed from your active list. This can be reversed by an
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
