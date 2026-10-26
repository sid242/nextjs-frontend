"use client";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/lib/context/sidebar-context";
import { cn } from "@/lib/utils";

import { useActiveTenant } from "../queries";
import type { Tenant, TenantPlan } from "../schemas";
import { TenantLogo } from "./tenant-logo";

interface TenantSwitcherProps {
  collapsed?: boolean;
}

const PLAN_BADGES: Record<TenantPlan, "default" | "secondary" | "outline"> = {
  ENTERPRISE: "default",
  PRO: "secondary",
  FREE: "outline",
};

export function TenantSwitcher({ collapsed: propCollapsed }: TenantSwitcherProps) {
  const sidebar = useSidebar();
  const collapsed = propCollapsed ?? sidebar.collapsed;
  const { activeTenant, tenants, setActiveTenantId } = useActiveTenant();

  const triggerContent = (
    <Button
      variant="ghost"
      className={cn(
        "hover:bg-accent/60 border-border/40 flex h-12 w-full items-center gap-2.5 rounded-lg border p-2 text-left transition-all",
        collapsed && "h-10 w-10 justify-center p-0",
      )}
      aria-label="Switch organization"
    >
      <TenantLogo variant="icon" tenant={activeTenant} showName={false} className="shrink-0" />

      {!collapsed && (
        <>
          <div className="grid flex-1 text-left leading-tight">
            <span className="text-foreground truncate text-sm font-semibold tracking-tight">
              {activeTenant?.name ?? "Select Organization"}
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-normal">
              <Badge
                variant={PLAN_BADGES[activeTenant?.plan ?? "PRO"]}
                className="h-4 px-1 text-[10px] uppercase"
              >
                {activeTenant?.plan ?? "PRO"}
              </Badge>
              <span className="truncate opacity-75">{activeTenant?.slug}</span>
            </span>
          </div>
          <ChevronsUpDownIcon className="text-muted-foreground/70 ml-auto size-4 shrink-0" />
        </>
      )}
    </Button>
  );

  return (
    <DropdownMenu>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>{triggerContent}</DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{activeTenant?.name ?? "Organization"}</p>
            <p className="text-muted-foreground text-xs">{activeTenant?.plan ?? "PRO"} Plan</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>{triggerContent}</DropdownMenuTrigger>
      )}

      <DropdownMenuContent
        align={collapsed ? "start" : "center"}
        side={collapsed ? "right" : "bottom"}
        className="w-64"
      >
        <DropdownMenuLabel className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Organizations
        </DropdownMenuLabel>

        {tenants?.map((tenant: Tenant) => {
          const isSelected = tenant.id === activeTenant?.id;
          return (
            <DropdownMenuItem
              key={tenant.id}
              onSelect={() => setActiveTenantId(tenant.id)}
              className="flex items-center justify-between gap-2 py-2"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <TenantLogo
                  variant="icon"
                  tenant={tenant}
                  showName={false}
                  className="size-6 shrink-0"
                />
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-medium">{tenant.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{tenant.slug}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Badge variant={PLAN_BADGES[tenant.plan]} className="h-4 px-1 text-[9px]">
                  {tenant.plan}
                </Badge>
                {isSelected && <CheckIcon className="text-primary size-4 shrink-0" />}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
