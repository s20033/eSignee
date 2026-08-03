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
import { bulkDeleteAuditLogs } from "../actions";

type BulkDeleteAuditLogsDialogProps = {
  entryIds: string[];
  onDeleted: () => void;
};

export const BulkDeleteAuditLogsDialog = ({ entryIds, onDeleted }: BulkDeleteAuditLogsDialogProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onConfirm = () => {
    startTransition(async () => {
      const result = await bulkDeleteAuditLogs(entryIds);
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
          <DialogTitle>Delete {entryIds.length} audit log entr{entryIds.length === 1 ? "y" : "ies"}?</DialogTitle>
          <DialogDescription>
            This permanently removes these entries — there is no restore. If you need a record for a labor
            inspection, export the relevant month first.
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
