import type { ReactNode } from "react";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardFooter } from "@/features/dashboard/components/dashboard-footer";

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const profile = await getCurrentProfile();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <DashboardSidebar companyName={profile.companyName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader companyName={profile.companyName} email={profile.email} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {children}
        </main>
        <DashboardFooter />
      </div>
    </div>
  );
};

export default DashboardLayout;
