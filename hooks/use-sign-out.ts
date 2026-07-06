"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/features/auth/actions";

export const useSignOut = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSignOut = () => {
    startTransition(async () => {
      await signOut();
      router.push("/login");
      router.refresh();
    });
  };

  return { onSignOut, isPending };
};
