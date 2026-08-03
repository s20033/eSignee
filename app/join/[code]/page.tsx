import Link from "next/link";
import { getTenantByInviteCode } from "@/features/auth/actions";
import { RegisterEmployeeForm } from "@/features/auth/components/register-employee-form";

type JoinPageProps = {
  params: Promise<{ code: string }>;
};

const JoinPage = async ({ params }: JoinPageProps) => {
  const { code } = await params;
  const tenant = await getTenantByInviteCode(code);

  if (!tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-2 text-center">
          <h1 className="text-xl font-semibold">Link no longer valid</h1>
          <p className="text-sm text-muted-foreground">
            This invite link is invalid or has expired. Ask your employer for a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Join {tenant.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in your details to request access. Your employer will review and approve it.
          </p>
        </div>
        <RegisterEmployeeForm inviteCode={code} />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default JoinPage;
