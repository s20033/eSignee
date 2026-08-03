import { SignOutLink } from "@/features/employee-portal/components/sign-out-link";

export const TenantSuspendedScreen = () => (
  <div className="flex min-h-screen items-center justify-center px-4">
    <div className="w-full max-w-sm space-y-3 text-center">
      <h1 className="text-xl font-semibold">Account suspended</h1>
      <p className="text-sm text-muted-foreground">
        This company&apos;s account has been suspended. Contact support if you believe this is a mistake.
      </p>
      <SignOutLink />
    </div>
  </div>
);
