"use client";

import { Button } from "@/components/ui/button";
import { useSignOut } from "@/hooks/use-sign-out";

export const SignOutLink = () => {
  const { onSignOut, isPending } = useSignOut();

  return (
    <Button variant="outline" size="sm" onClick={onSignOut} disabled={isPending}>
      Sign out
    </Button>
  );
};
