"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { resendDocumentSigningEmail } from "../actions";

type ResendSigningEmailButtonProps = {
  documentId: string;
};

export const ResendSigningEmailButton = ({ documentId }: ResendSigningEmailButtonProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await resendDocumentSigningEmail(documentId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onClick} disabled={isPending}>
        {isPending ? "Sending…" : "Send again"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};
