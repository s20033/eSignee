import type { ReactNode } from "react";
import Link from "next/link";
import { getCurrentSuperAdmin } from "@/lib/auth/get-current-super-admin";
import { SignOutLink } from "@/features/employee-portal/components/sign-out-link";

const SuperAdminLayout = async ({ children }: { children: ReactNode }) => {
  const superAdmin = await getCurrentSuperAdmin();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Link href="/super-admin" className="text-sm font-semibold">
            eSignee Platform Admin
          </Link>
          <div className="flex-1" />
          <span className="hidden text-sm text-muted-foreground sm:inline">{superAdmin.email}</span>
          <SignOutLink />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
};

export default SuperAdminLayout;
