"use client";

import { useEffect } from "react";
import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export const ErrorState = ({ error, reset }: ErrorStateProps) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <AlertTriangleIcon className="size-8 text-muted-foreground" />
      <div>
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          Try again, or refresh the page if it keeps happening.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
};
