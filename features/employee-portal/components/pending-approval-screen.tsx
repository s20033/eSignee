import { SignOutLink } from "./sign-out-link";

export const PendingApprovalScreen = () => (
  <div className="flex min-h-screen items-center justify-center px-4">
    <div className="w-full max-w-sm space-y-3 text-center">
      <h1 className="text-xl font-semibold">Waiting for approval</h1>
      <p className="text-sm text-muted-foreground">
        Your employer hasn&apos;t approved your account yet. We&apos;ll email you as soon as they do.
      </p>
      <SignOutLink />
    </div>
  </div>
);
