import { LayoutDashboardIcon, UsersIcon, FileTextIcon, SettingsIcon, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/dashboard/employees", label: "Employees", icon: UsersIcon },
  { href: "/dashboard/templates", label: "Templates", icon: FileTextIcon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];
