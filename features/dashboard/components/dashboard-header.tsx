import { DashboardMobileNav } from "@/features/dashboard/components/dashboard-mobile-nav";
import { DashboardUserMenu } from "@/features/dashboard/components/dashboard-user-menu";

type DashboardHeaderProps = {
  companyName: string;
  email: string;
};

export const DashboardHeader = ({ companyName, email }: DashboardHeaderProps) => {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm supports-backdrop-filter:bg-background/80 md:px-6">
      <DashboardMobileNav />
      <span className="font-semibold md:hidden">{companyName}</span>
      <div className="flex-1" />
      <DashboardUserMenu companyName={companyName} email={email} />
    </header>
  );
};
