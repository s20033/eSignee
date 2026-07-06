import Link from "next/link";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

const SignUpPage = () => (
  <div className="flex min-h-screen items-center justify-center px-4">
    <div className="w-full max-w-sm space-y-6">
      <h1 className="text-center text-2xl font-semibold">Create your account</h1>
      <SignUpForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  </div>
);

export default SignUpPage;
