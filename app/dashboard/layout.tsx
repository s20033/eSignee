import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getCurrentTenant } from "@/lib/auth/get-current-tenant";
import { countPendingEmployees } from "@/features/approvals/actions";
import { countPendingIdentityDocumentReviews, countExpiringIdentityDocuments } from "@/features/identity-documents/actions";
import type { NavBadgeCounts } from "@/features/dashboard/nav-items";
import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardFooter } from "@/features/dashboard/components/dashboard-footer";
import { TenantSuspendedScreen } from "@/components/shared/tenant-suspended-screen";

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const profile = await getCurrentProfile();

  // Employee accounts belong on the employee portal, not the employer dashboard.
  if (profile.role !== "tenant_admin") {
    redirect("/portal");
  }

  const tenant = await getCurrentTenant();
  if (tenant.status === "suspended") {
    return <TenantSuspendedScreen />;
  }

  const [pendingApprovalsCount, pendingIdentityDocumentReviewsCount, expiringIdentityDocumentsCount] =
    await Promise.all([
      countPendingEmployees(),
      countPendingIdentityDocumentReviews(),
      countExpiringIdentityDocuments(),
    ]);

  const badgeCounts: NavBadgeCounts = {
    pendingApprovalsCount,
    pendingIdentityDocumentReviewsCount,
    expiringIdentityDocumentsCount,
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <DashboardSidebar companyName={profile.companyName} badgeCounts={badgeCounts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader companyName={profile.companyName} email={profile.email} badgeCounts={badgeCounts} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {children}
        </main>
        <DashboardFooter />
      </div>
    </div>
  );
};

export default DashboardLayout;
