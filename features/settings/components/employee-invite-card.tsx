"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { regenerateEmployeeInviteLink } from "../actions";

type EmployeeInviteCardProps = {
  inviteLink: string;
};

export const EmployeeInviteCard = ({ inviteLink }: EmployeeInviteCardProps) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onRegenerate = () => {
    if (!window.confirm("The current invite link will stop working. Continue?")) return;
    startTransition(async () => {
      await regenerateEmployeeInviteLink();
      router.refresh();
    });
  };

  return (
    <Card className="max-w-md space-y-3 p-4">
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">Employee sign-up link</h2>
        <p className="text-sm text-muted-foreground">
          Share this link with new hires so they can create their own account.
        </p>
      </div>
      <div className="flex gap-2">
        <Input readOnly value={inviteLink} className="font-mono text-xs" />
        <Button variant="outline" onClick={onCopy} className="shrink-0">
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={isPending}>
        {isPending ? "Regenerating..." : "Regenerate link"}
      </Button>
    </Card>
  );
};
