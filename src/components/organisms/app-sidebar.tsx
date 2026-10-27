"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { SidebarProvider } from "@/lib/context/sidebar-context";
import { useUiStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";

import { SidebarNav } from "./sidebar-nav";

interface AppSidebarProps {
  tenantSwitcher?: ReactNode;
  userProfile?: ReactNode;
  navigationSlot?: ReactNode;
}

/** Desktop sidebar. The collapsed state is a persisted zustand preference. */
export function AppSidebar({ tenantSwitcher, userProfile, navigationSlot }: AppSidebarProps) {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggle = useUiStore((state) => state.toggleSidebar);

  return (
    <SidebarProvider value={{ collapsed, toggle, isMobile: false }}>
      <aside
        className={cn(
          "bg-sidebar sticky top-0 hidden h-screen shrink-0 flex-col justify-between border-r p-3 transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {/* Top tenant switcher / brand */}
          <div className="shrink-0">
            {tenantSwitcher ?? (
              <div
                className={cn(
                  "flex items-center",
                  collapsed ? "justify-center" : "justify-between",
                )}
              >
                {!collapsed && (
                  <Link href="/dashboard" className="px-2 text-lg font-semibold tracking-tight">
                    {siteConfig.name}
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggle}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  aria-expanded={!collapsed}
                >
                  {collapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
                </Button>
              </div>
            )}
          </div>

          {/* Navigation list with independent scroll container */}
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-0.5">
            {navigationSlot ?? <SidebarNav collapsed={collapsed} />}
          </div>
        </div>

        {/* User profile footer */}
        <div className="border-border/40 mt-auto shrink-0 border-t pt-3">
          {userProfile ?? (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
              </Button>
            </div>
          )}
        </div>
      </aside>
    </SidebarProvider>
  );
}
