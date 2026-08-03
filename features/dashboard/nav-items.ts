import {
  LayoutDashboardIcon,
  UsersIcon,
  FilesIcon,
  FileTextIcon,
  UserCheckIcon,
  IdCardIcon,
  ShieldCheckIcon,
  ScrollTextIcon,
  SettingsIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shows a pending-count badge next to the label when set. */
  badgeCount?: number;
};

export type NavBadgeCounts = {
  pendingApprovalsCount: number;
  pendingIdentityDocumentReviewsCount: number;
  expiringIdentityDocumentsCount: number;
};

export const DASHBOARD_NAV_ITEMS = ({
  pendingApprovalsCount,
  pendingIdentityDocumentReviewsCount,
  expiringIdentityDocumentsCount,
}: NavBadgeCounts): NavItem[] => [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/dashboard/employees", label: "Employees", icon: UsersIcon },
  {
    href: "/dashboard/approvals",
    label: "Pending approvals",
    icon: UserCheckIcon,
    badgeCount: pendingApprovalsCount,
  },
  {
    href: "/dashboard/identity-documents",
    label: "ID reviews",
    icon: IdCardIcon,
    badgeCount: pendingIdentityDocumentReviewsCount,
  },
  {
    href: "/dashboard/compliance",
    label: "Compliance",
    icon: ShieldCheckIcon,
    badgeCount: expiringIdentityDocumentsCount,
  },
  { href: "/dashboard/documents", label: "Documents", icon: FilesIcon },
  { href: "/dashboard/templates", label: "Templates", icon: FileTextIcon },
  { href: "/dashboard/audit-log", label: "Audit log", icon: ScrollTextIcon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

/** Dashboard's own item matches only on exact path; every other item matches its whole subtree. */
export const isNavItemActive = (pathname: string, href: string): boolean =>
  href === "/dashboard" ? pathname === href : pathname.startsWith(href);
