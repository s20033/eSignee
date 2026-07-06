"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { getDocumentDownloadUrl } from "../actions";

type DownloadDocumentButtonProps = {
  documentId: string;
};

export const DownloadDocumentButton = ({ documentId }: DownloadDocumentButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const url = await getDocumentDownloadUrl(documentId);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    });
  };

  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={isPending}>
      {isPending ? "Loading..." : "Download"}
    </Button>
  );
};
