"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV_ITEMS, isNavItemActive, type NavBadgeCounts } from "@/features/dashboard/nav-items";

type DashboardMobileNavProps = {
  badgeCounts: NavBadgeCounts;
};

export const DashboardMobileNav = ({ badgeCounts }: DashboardMobileNavProps) => {
  const pathname = usePathname();
  const navItems = DASHBOARD_NAV_ITEMS(badgeCounts);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
        <MenuIcon />
        <span className="sr-only">Open navigation</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        {navItems.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <DropdownMenuItem
              key={item.href}
              render={<Link href={item.href} />}
              className={cn(isActive && "bg-accent text-accent-foreground")}
            >
              <Icon />
              <span className="flex-1">{item.label}</span>
              {!!item.badgeCount && (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  {item.badgeCount}
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
