"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSignOut } from "@/hooks/use-sign-out";

const PORTAL_NAV_ITEMS = [
  { href: "/portal", label: "Overview" },
  { href: "/portal/documents", label: "Documents" },
  { href: "/portal/identity-documents", label: "ID documents" },
];

type PortalHeaderProps = {
  companyName: string;
  employeeName: string;
};

export const PortalHeader = ({ companyName, employeeName }: PortalHeaderProps) => {
  const pathname = usePathname();
  const { onSignOut, isPending } = useSignOut();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-4">
        <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1">
          <Image src="/img/eSignee.png" alt="eSignee" width={28} height={28} className="size-full object-contain" />
        </div>
        <span className="truncate text-sm font-semibold">{companyName}</span>
        <nav className="ml-4 hidden gap-1 sm:flex">
          {PORTAL_NAV_ITEMS.map((item) => {
            const isActive = item.href === "/portal" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex-1" />
        <span className="hidden text-sm text-muted-foreground sm:inline">{employeeName}</span>
        <Button variant="ghost" size="sm" onClick={onSignOut} disabled={isPending}>
          <LogOutIcon className="size-4" />
          Sign out
        </Button>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t px-4 py-2 sm:hidden">
        {PORTAL_NAV_ITEMS.map((item) => {
          const isActive = item.href === "/portal" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
};
