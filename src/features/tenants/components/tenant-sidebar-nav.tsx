"use client";

import { SidebarNav } from "@/components/organisms/sidebar-nav";
import { useSidebar } from "@/lib/context/sidebar-context";

import { useActiveTenant, useTenantContext } from "../queries";

interface TenantSidebarNavProps {
  collapsed?: boolean;
  orientation?: "vertical" | "horizontal";
  onNavigate?: () => void;
}

export function TenantSidebarNav({
  collapsed: collapsedProp,
  orientation = "vertical",
  onNavigate,
}: TenantSidebarNavProps) {
  const sidebar = useSidebar();
  const collapsed = collapsedProp ?? sidebar?.collapsed ?? false;
  const { activeTenant, activeSlug } = useActiveTenant();
  const tenantIdentifier = activeTenant?.id ?? activeSlug;
  const { data: context } = useTenantContext(tenantIdentifier ?? null);

  return (
    <SidebarNav
      collapsed={collapsed}
      orientation={orientation}
      onNavigate={onNavigate}
      permissions={context?.permissions ?? []}
      modules={context?.businessModules}
    />
  );
}
