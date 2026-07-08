import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Credentials are never accepted via query string — this only guards against
// stray bookmarks/autofill links that put them there, by scrubbing the URL
// immediately rather than leaving a password sitting in the address bar.
const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const params = await searchParams;
  if ("password" in params || "email" in params) {
    redirect("/login");
  }

  return (
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
};

export default LoginPage;
