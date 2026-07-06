"use client";

import { Button } from "@/components/ui/button";
import { useSignOut } from "@/hooks/use-sign-out";

export const SignOutButton = () => {
  const { onSignOut, isPending } = useSignOut();

  return (
    <Button variant="ghost" size="sm" onClick={onSignOut} disabled={isPending}>
      Sign out
    </Button>
  );
};
