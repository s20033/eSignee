"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

type ViewIdentityDocumentButtonProps = {
  id: string;
  getUrl: (id: string) => Promise<string | null>;
};

export const ViewIdentityDocumentButton = ({ id, getUrl }: ViewIdentityDocumentButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const url = await getUrl(id);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    });
  };

  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={isPending}>
      {isPending ? "Loading..." : "View"}
    </Button>
  );
};
