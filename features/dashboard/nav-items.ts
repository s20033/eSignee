import {
  LayoutDashboardIcon,
  UsersIcon,
  FilesIcon,
  FileTextIcon,
  SettingsIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/dashboard/employees", label: "Employees", icon: UsersIcon },
  { href: "/dashboard/documents", label: "Documents", icon: FilesIcon },
  { href: "/dashboard/templates", label: "Templates", icon: FileTextIcon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

/** Dashboard's own item matches only on exact path; every other item matches its whole subtree. */
export const isNavItemActive = (pathname: string, href: string): boolean =>
  href === "/dashboard" ? pathname === href : pathname.startsWith(href);
