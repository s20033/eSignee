"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { softDeleteDocument, restoreDocument } from "../actions";

type DocumentDeleteRestoreButtonProps = {
  documentId: string;
  deleted: boolean;
};

export const DocumentDeleteRestoreButton = ({ documentId, deleted }: DocumentDeleteRestoreButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const result = deleted ? await restoreDocument(documentId) : await softDeleteDocument(documentId);
      if (result.success) {
        router.refresh();
      }
    });
  };

  return (
    <Button variant={deleted ? "outline" : "destructive"} size="sm" onClick={onClick} disabled={isPending}>
      {isPending ? "Working…" : deleted ? "Restore" : "Delete"}
    </Button>
  );
};
