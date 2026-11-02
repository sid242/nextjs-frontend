"use client";

import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon, Loader2Icon } from "lucide-react";

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
import { switchWorkspaceOrHandoff } from "@/lib/tenancy/handoff";
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
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const handleSwitch = async (tenant: Tenant) => {
    if (!tenant?.id || tenant.id === activeTenant?.id) return;
    setSwitchingId(tenant.id);
    try {
      await switchWorkspaceOrHandoff({
        tenant,
        onLocalNavigate: () => {
          setActiveTenantId?.(tenant.id);
        },
      });
    } catch {
      setActiveTenantId?.(tenant.id);
    } finally {
      setSwitchingId(null);
    }
  };

  const triggerContent = (
    <Button
      variant="ghost"
      className={cn(
        "bg-sidebar-accent/40 hover:bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:text-sidebar-foreground flex h-12 w-full items-center gap-2.5 rounded-lg border p-2 text-left transition-all",
        collapsed && "h-10 w-10 justify-center p-0",
      )}
      aria-label="Switch organization"
    >
      <TenantLogo variant="icon" tenant={activeTenant} showName={false} className="shrink-0" />

      {!collapsed && (
        <>
          <div className="flex min-w-0 flex-1 flex-col text-left leading-tight">
            <span className="text-sidebar-foreground truncate text-sm font-semibold tracking-tight">
              {activeTenant?.name ?? "Select Organization"}
            </span>
            <div className="flex items-center gap-1.5 pt-0.5 text-xs">
              <Badge
                variant={PLAN_BADGES[activeTenant?.plan ?? "PRO"]}
                className="h-3.5 px-1 text-[9px] font-semibold tracking-wider uppercase"
              >
                {activeTenant?.plan ?? "PRO"}
              </Badge>
              <span className="text-sidebar-foreground/60 truncate text-[11px]">
                {activeTenant?.slug}
              </span>
            </div>
          </div>
          <ChevronsUpDownIcon className="text-sidebar-foreground/60 ml-auto size-4 shrink-0" />
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
          const isSwitching = tenant.id === switchingId;
          return (
            <DropdownMenuItem
              key={tenant.id}
              disabled={Boolean(switchingId)}
              onSelect={() => handleSwitch(tenant)}
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
                {isSwitching ? (
                  <Loader2Icon className="text-primary size-4 animate-spin" />
                ) : isSelected ? (
                  <CheckIcon className="text-primary size-4 shrink-0" />
                ) : null}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
