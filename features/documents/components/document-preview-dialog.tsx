"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getDocumentPreviewUrl } from "../actions";

type DocumentPreviewDialogProps = {
  documentId: string;
  title: string;
};

export const DocumentPreviewDialog = ({ documentId, title }: DocumentPreviewDialogProps) => {
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && !previewUrl) {
      startTransition(async () => {
        setPreviewUrl(await getDocumentPreviewUrl(documentId));
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Preview</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {isPending && <p className="text-sm text-muted-foreground">Loading preview…</p>}
        {!isPending && previewUrl && (
          <iframe src={previewUrl} title={title} className="h-[70vh] w-full rounded-lg border" />
        )}
        {!isPending && !previewUrl && open && (
          <p className="text-sm text-muted-foreground">Preview is not available for this document.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};
