import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

const ForgotPasswordPage = () => (
  <div className="flex min-h-screen items-center justify-center px-4">
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll email you a link to choose a new password.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </div>
  </div>
);

export default ForgotPasswordPage;
