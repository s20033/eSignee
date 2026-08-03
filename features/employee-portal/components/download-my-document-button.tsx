"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { getMyDocumentDownloadUrl } from "../actions";

type DownloadMyDocumentButtonProps = {
  documentId: string;
};

export const DownloadMyDocumentButton = ({ documentId }: DownloadMyDocumentButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const url = await getMyDocumentDownloadUrl(documentId);
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
