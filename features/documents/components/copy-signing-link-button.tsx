"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type CopySigningLinkButtonProps = {
  token: string;
};

export const CopySigningLinkButton = ({ token }: CopySigningLinkButtonProps) => {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    const url = `${window.location.origin}/sign/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" onClick={onClick}>
      {copied ? "Copied!" : "Copy signing link"}
    </Button>
  );
};
