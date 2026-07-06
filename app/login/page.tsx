import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";

const LoginPage = () => (
  <div className="flex min-h-screen items-center justify-center px-4">
    <div className="w-full max-w-sm space-y-6">
      <h1 className="text-center text-2xl font-semibold">Sign in</h1>
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </div>
  </div>
);

export default LoginPage;
