"use client";

import Link from "next/link";
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { User } from "@/lib/api/types";
import { useSidebar } from "@/lib/context/sidebar-context";
import { initials } from "@/lib/format";

interface UserProfileFooterProps {
  user: Pick<User, "name" | "email" | "role">;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function UserProfileFooter({
  user,
  collapsed: propCollapsed,
  onToggleCollapse,
}: UserProfileFooterProps) {
  const sidebar = useSidebar();
  const collapsed = propCollapsed ?? sidebar.collapsed;
  const toggle = onToggleCollapse ?? sidebar.toggle;
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/settings">
              <Avatar className="size-8 transition-opacity hover:opacity-80">
                <AvatarFallback className="text-xs font-semibold">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{user.name}</p>
            <p className="text-muted-foreground text-xs">{user.role}</p>
          </TooltipContent>
        </Tooltip>

        {toggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                aria-label="Expand sidebar"
                className="size-8"
              >
                <PanelLeftOpenIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <div className="border-border/60 flex items-center justify-between gap-2 rounded-lg border p-2">
      <Link
        href="/settings"
        className="flex min-w-0 flex-1 items-center gap-2.5 transition-opacity hover:opacity-80"
      >
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="text-xs font-semibold">{initials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="grid min-w-0 text-left leading-tight">
          <span className="text-foreground truncate text-xs font-semibold">{user.name}</span>
          <span className="text-muted-foreground truncate text-[11px] capitalize">
            {user.role.toLowerCase()}
          </span>
        </div>
      </Link>

      {toggle && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Collapse sidebar"
              className="text-muted-foreground hover:text-foreground size-7 shrink-0"
            >
              <PanelLeftCloseIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Collapse sidebar</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
