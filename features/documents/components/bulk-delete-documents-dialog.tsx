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
import { bulkSoftDeleteDocuments } from "../actions";

type BulkDeleteDocumentsDialogProps = {
  documentIds: string[];
  onDeleted: () => void;
};

export const BulkDeleteDocumentsDialog = ({ documentIds, onDeleted }: BulkDeleteDocumentsDialogProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onConfirm = () => {
    startTransition(async () => {
      const result = await bulkSoftDeleteDocuments(documentIds);
      setOpen(false);
      if (result.success) {
        onDeleted();
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>Delete selected</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {documentIds.length} document{documentIds.length === 1 ? "" : "s"}?</DialogTitle>
          <DialogDescription>
            These documents will be removed from your active list. This can be reversed by an administrator from
            each document&apos;s detail page.
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
