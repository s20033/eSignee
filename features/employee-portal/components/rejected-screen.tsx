import { SignOutLink } from "./sign-out-link";

type RejectedScreenProps = {
  reason: string | null;
};

export const RejectedScreen = ({ reason }: RejectedScreenProps) => (
  <div className="flex min-h-screen items-center justify-center px-4">
    <div className="w-full max-w-sm space-y-3 text-center">
      <h1 className="text-xl font-semibold">Request not approved</h1>
      <p className="text-sm text-muted-foreground">
        Your employer wasn&apos;t able to approve your account request.
      </p>
      {reason && (
        <p className="rounded-md bg-muted p-3 text-sm">
          <span className="font-medium">Reason: </span>
          {reason}
        </p>
      )}
      <SignOutLink />
    </div>
  </div>
);
