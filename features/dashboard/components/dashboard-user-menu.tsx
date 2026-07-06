"use client";

import Link from "next/link";
import { SettingsIcon, LogOutIcon, ChevronsUpDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSignOut } from "@/hooks/use-sign-out";

type DashboardUserMenuProps = {
  companyName: string;
  email: string;
};

export const DashboardUserMenu = ({ companyName, email }: DashboardUserMenuProps) => {
  const { onSignOut, isPending } = useSignOut();
  const initial = companyName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg py-1.5 pr-1.5 pl-2 text-sm hover:bg-accent"
          />
        }
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {initial}
        </span>
        <span className="hidden max-w-32 truncate font-medium sm:inline">{companyName}</span>
        <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="truncate font-medium text-foreground">{companyName}</p>
            <p className="truncate text-muted-foreground">{email}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" disabled={isPending} onClick={onSignOut}>
            <LogOutIcon />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
