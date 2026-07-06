"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftCloseIcon, PanelLeftIcon, FileSignatureIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV_ITEMS } from "@/features/dashboard/nav-items";

const STORAGE_KEY = "dashboard-sidebar-collapsed";

type DashboardSidebarProps = {
  companyName: string;
};

export const DashboardSidebar = ({ companyName }: DashboardSidebarProps) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <FileSignatureIcon className="size-4" />
        </div>
        {!collapsed && <span className="truncate text-sm font-semibold">{companyName}</span>}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? <PanelLeftIcon className="size-4.5 shrink-0" /> : <PanelLeftCloseIcon className="size-4.5 shrink-0" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};
