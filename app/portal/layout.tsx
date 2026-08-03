import type { ReactNode } from "react";
import { getPortalContext } from "@/lib/auth/get-current-portal-user";
import { PortalHeader } from "@/features/employee-portal/components/portal-header";
import { PendingApprovalScreen } from "@/features/employee-portal/components/pending-approval-screen";
import { RejectedScreen } from "@/features/employee-portal/components/rejected-screen";
import { TenantSuspendedScreen } from "@/components/shared/tenant-suspended-screen";

const PortalLayout = async ({ children }: { children: ReactNode }) => {
  const context = await getPortalContext();

  if (context.status === "pending") {
    return <PendingApprovalScreen />;
  }

  if (context.status === "rejected") {
    return <RejectedScreen reason={context.reason} />;
  }

  if (context.status === "suspended") {
    return <TenantSuspendedScreen />;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <PortalHeader companyName={context.profile.companyName} employeeName={context.employee.fullName} />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
};

export default PortalLayout;
