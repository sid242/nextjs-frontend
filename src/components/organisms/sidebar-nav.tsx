"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderIcon, LayoutDashboardIcon, SettingsIcon, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig, type NavIcon } from "@/config/site";

const ICONS: Record<NavIcon, LucideIcon> = {
  "layout-dashboard": LayoutDashboardIcon,
  folder: FolderIcon,
  settings: SettingsIcon,
};

interface SidebarNavProps {
  orientation?: "vertical" | "horizontal";
  /** Icon-only mode. Labels stay in the DOM (sr-only) so the links remain accessible. */
  collapsed?: boolean;
}

export function SidebarNav({ orientation = "vertical", collapsed = false }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className={cn(
        "flex gap-1",
        orientation === "vertical" ? "flex-col" : "flex-row overflow-x-auto",
      )}
    >
      {siteConfig.nav.map((item) => {
        const Icon = ICONS[item.icon];
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.title : undefined}
            aria-current={active ? "page" : undefined}
            className={cn(
              "hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              collapsed && "justify-center px-2",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className={cn(collapsed && "sr-only")}>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
