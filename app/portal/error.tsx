"use client";

import { ErrorState } from "@/components/shared/error-state";

const PortalError = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => (
  <ErrorState error={error} reset={reset} />
);

export default PortalError;
