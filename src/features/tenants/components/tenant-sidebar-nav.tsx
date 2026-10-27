"use client";

import { SidebarNav } from "@/components/organisms/sidebar-nav";

import { useActiveTenant, useTenantContext } from "../queries";

interface TenantSidebarNavProps {
  collapsed?: boolean;
  orientation?: "vertical" | "horizontal";
  onNavigate?: () => void;
}

export function TenantSidebarNav({
  collapsed = false,
  orientation = "vertical",
  onNavigate,
}: TenantSidebarNavProps) {
  const { activeTenant } = useActiveTenant();
  const { data: context } = useTenantContext(activeTenant?.id);

  return (
    <SidebarNav
      collapsed={collapsed}
      orientation={orientation}
      onNavigate={onNavigate}
      permissions={context?.permissions}
    />
  );
}
