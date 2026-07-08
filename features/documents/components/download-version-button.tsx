"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { getVersionDownloadUrl } from "../actions";

type DownloadVersionButtonProps = {
  documentId: string;
  versionId: string;
};

export const DownloadVersionButton = ({ documentId, versionId }: DownloadVersionButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const url = await getVersionDownloadUrl(documentId, versionId);
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
