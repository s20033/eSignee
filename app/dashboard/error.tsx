"use client";

import { ErrorState } from "@/components/shared/error-state";

const DashboardError = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => (
  <ErrorState error={error} reset={reset} />
);

export default DashboardError;
