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
import { DASHBOARD_NAV_ITEMS } from "@/features/dashboard/nav-items";

export const DashboardMobileNav = () => {
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
        <MenuIcon />
        <span className="sr-only">Open navigation</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <DropdownMenuItem
              key={item.href}
              render={<Link href={item.href} />}
              className={cn(isActive && "bg-accent text-accent-foreground")}
            >
              <Icon />
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
