import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

const ResetPasswordPage = () => (
  <div className="flex min-h-screen items-center justify-center px-4">
    <div className="w-full max-w-sm space-y-6">
      <h1 className="text-center text-2xl font-semibold">Choose a new password</h1>
      <ResetPasswordForm />
    </div>
  </div>
);

export default ResetPasswordPage;
