"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { verifyIdentityDocument } from "../actions";

type VerifyButtonProps = {
  id: string;
};

export const VerifyButton = ({ id }: VerifyButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const onVerify = () => {
    startTransition(async () => {
      await verifyIdentityDocument(id);
    });
  };

  return (
    <Button size="sm" onClick={onVerify} disabled={isPending}>
      {isPending ? "Verifying..." : "Verify"}
    </Button>
  );
};
