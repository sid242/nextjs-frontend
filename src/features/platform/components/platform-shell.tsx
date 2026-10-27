"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronRight,
  ExternalLink,
  FileText,
  KeyRound,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";

import { ThemeToggle } from "@/components/molecules/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { hasPlatformPermission, PLATFORM_PERMISSION_KEYS } from "../permissions";
import { usePlatformLogout, usePlatformMe, useSupportSessions } from "../queries";
import { PlatformTwoFactorDialog } from "./platform-two-factor-dialog";

interface PlatformShellProps {
  children: ReactNode;
}

interface NavItemConfig {
  href: string;
  label: string;
  description: string;
  icon: typeof Building2;
  permission: string | string[];
}

interface NavGroup {
  title: string;
  items: NavItemConfig[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Core & Telemetry",
    items: [
      {
        href: "/platform/dashboard",
        label: "Overview",
        description: "System KPIs, telemetry & operations control",
        icon: LayoutDashboard,
        permission: PLATFORM_PERMISSION_KEYS.TENANTS_READ,
      },
      {
        href: "/platform/tenants",
        label: "Workspaces",
        description: "Customer organizations, databases & status",
        icon: Building2,
        permission: PLATFORM_PERMISSION_KEYS.TENANTS_READ,
      },
      {
        href: "/platform/plans",
        label: "Plans & Tiers",
        description: "Multi-tenant tiers, seat limits & quotas",
        icon: Layers,
        permission: PLATFORM_PERMISSION_KEYS.BILLING_READ,
      },
    ],
  },
  {
    title: "Governance & Access",
    items: [
      {
        href: "/platform/staff",
        label: "Staff Directory",
        description: "Manage internal operator accounts & status",
        icon: Users,
        permission: PLATFORM_PERMISSION_KEYS.STAFF_READ,
      },
      {
        href: "/platform/roles",
        label: "Roles & Matrix",
        description: "System & custom resource::action catalogue",
        icon: ShieldCheck,
        permission: PLATFORM_PERMISSION_KEYS.ROLES_READ,
      },
      {
        href: "/platform/support-sessions",
        label: "Support Sessions",
        description: "Time-bound, audited tenant delegation",
        icon: LifeBuoy,
        permission: [PLATFORM_PERMISSION_KEYS.SUPPORT_START, PLATFORM_PERMISSION_KEYS.SUPPORT_END],
      },
    ],
  },
  {
    title: "Security & Auditing",
    items: [
      {
        href: "/platform/audit-logs",
        label: "Audit Trail",
        description: "Immutable compliance & security logs",
        icon: FileText,
        permission: PLATFORM_PERMISSION_KEYS.AUDIT_READ,
      },
    ],
  },
];

export function PlatformShell({ children }: PlatformShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const { data: staff, isLoading: staffLoading } = usePlatformMe();
  const { mutate: logout, isPending: loggingOut } = usePlatformLogout();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const canInspectSupport = hasPlatformPermission(staff, [
    PLATFORM_PERMISSION_KEYS.SUPPORT_START,
    PLATFORM_PERMISSION_KEYS.SUPPORT_END,
  ]);

  // Query active support sessions only if staff has permission
  const { data: sessionsData } = useSupportSessions(
    { page: 1, limit: 10 },
    { enabled: canInspectSupport },
  );
  const activeSessions = (sessionsData?.items ?? []).filter((s) => s?.status === "ACTIVE");
  const activeSupportCount = activeSessions.length;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="bg-background text-foreground flex min-h-screen flex-col md:flex-row">
        {/* Mobile Top Bar */}
        <header className="bg-card/80 sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 bg-red-600/15 font-bold text-red-500 shadow-xs">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight">Platform Console</span>
              <span className="text-muted-foreground block font-mono text-[10px] tracking-widest uppercase">
                Staff Operator Surface
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Mobile Backdrop Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Desktop Sidebar & Mobile Drawer */}
        <aside
          className={cn(
            "bg-card/95 sticky top-0 z-50 flex h-screen shrink-0 flex-col border-r backdrop-blur-md transition-[width,transform] duration-200 ease-in-out",
            // Mobile behavior: fixed drawer
            "fixed inset-y-0 left-0 md:static md:translate-x-0",
            mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
            // Desktop width: collapsible
            collapsed ? "md:w-18" : "md:w-68",
          )}
        >
          {/* Brand & Collapse Header */}
          <div
            className={cn(
              "flex items-center border-b p-4 transition-all",
              collapsed ? "justify-center" : "justify-between",
            )}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-red-500/20">
                <ShieldAlert className="h-5 w-5" />
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold tracking-tight">SaaS Console</span>
                    <Badge
                      variant="outline"
                      className="border-red-500/40 px-1 py-0 font-mono text-[9px] text-red-500 uppercase"
                    >
                      Staff
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground truncate font-mono text-[10px]">
                      Operational
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Collapse button for desktop, Close button for mobile */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hidden h-8 w-8 md:flex"
                onClick={() => setCollapsed((prev) => !prev)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:hidden"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation Links with Groupings */}
          <nav className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-3 py-4">
            {NAV_GROUPS.map((group) => {
              const visibleItems = group.items.filter((item) =>
                hasPlatformPermission(staff, item.permission),
              );

              if (visibleItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-1">
                  {!collapsed && (
                    <div className="text-muted-foreground/70 px-2.5 pb-1 font-mono text-[10px] font-semibold tracking-wider uppercase">
                      {group.title}
                    </div>
                  )}

                  {visibleItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/platform/dashboard" &&
                        pathname?.startsWith(`${item.href}/`)) ||
                      (item.href === "/platform/dashboard" && pathname === "/platform");
                    const Icon = item.icon;
                    const isSupportItem = item.href === "/platform/support-sessions";

                    const linkContent = (
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg text-xs font-medium transition-all duration-150",
                          collapsed ? "mx-auto h-10 w-10 justify-center p-0" : "px-2.5 py-2",
                          isActive
                            ? "border border-red-500/20 bg-red-500/10 font-semibold text-red-600 shadow-xs dark:text-red-400"
                            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                        )}
                      >
                        {/* Active vertical accent bar on expanded mode */}
                        {isActive && !collapsed && (
                          <span className="absolute top-1/2 left-0 h-4 w-1 -translate-y-1/2 rounded-r-full bg-red-500" />
                        )}

                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />

                        {!collapsed && (
                          <>
                            <span className="truncate">{item.label}</span>
                            {isSupportItem && activeSupportCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="ml-auto flex animate-pulse items-center gap-1 border-0 bg-emerald-600 px-1.5 py-0 font-mono text-[10px] text-white"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                {activeSupportCount} Live
                              </Badge>
                            )}
                          </>
                        )}

                        {/* Collapsed active session indicator dot */}
                        {collapsed && isSupportItem && activeSupportCount > 0 && (
                          <span className="absolute top-1 right-1 h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                        )}
                      </Link>
                    );

                    if (collapsed) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent side="right" className="flex items-center gap-2">
                            <span>{item.label}</span>
                            {isSupportItem && activeSupportCount > 0 && (
                              <Badge variant="destructive" className="bg-emerald-600 text-[10px]">
                                {activeSupportCount} Active
                              </Badge>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return <div key={item.href}>{linkContent}</div>;
                  })}
                </div>
              );
            })}
          </nav>

          {/* Quick Return to Tenant App */}
          <div className="border-t p-3">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard"
                    className="border-border/60 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground mx-auto flex h-10 w-10 items-center justify-center rounded-lg border transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Switch to Customer Tenant App</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href="/dashboard"
                className="group border-border/60 bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/70 hover:text-foreground flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  <span>Customer Tenant App</span>
                </div>
                <Badge variant="secondary" className="px-1 font-mono text-[9px]">
                  Exit
                </Badge>
              </Link>
            )}
          </div>

          {/* Staff User Footer */}
          <div className="bg-muted/20 border-t p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "hover:bg-muted/80 flex w-full items-center rounded-lg text-left transition-colors",
                    collapsed ? "justify-center p-1.5" : "justify-between p-2",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/15 text-xs font-bold text-red-500">
                      {staff?.displayName ? (
                        staff.displayName.charAt(0).toUpperCase()
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    {!collapsed && (
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground truncate text-xs font-semibold">
                          {staff?.displayName ?? (staffLoading ? "Loading..." : "Staff Operator")}
                        </p>
                        <p className="text-muted-foreground truncate font-mono text-[10px]">
                          {staff?.roleKey ?? "PLATFORM_STAFF"}
                        </p>
                      </div>
                    )}
                  </div>
                  {!collapsed && <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={collapsed ? "center" : "end"}
                side="right"
                className="w-56"
              >
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">
                      {staff?.displayName ?? "Platform Staff"}
                    </span>
                    <span className="text-muted-foreground truncate font-mono text-[11px] font-normal">
                      {staff?.email}
                    </span>
                    <Badge
                      variant="outline"
                      className="mt-1.5 w-fit border-red-500/40 font-mono text-[10px] text-red-500"
                    >
                      {staff?.roleName ?? staff?.roleKey ?? "Platform Operator"}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTwoFactorOpen(true)} className="cursor-pointer">
                  <KeyRound className="mr-2 h-4 w-4 text-red-500" />
                  <span>Security & 2FA</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  disabled={loggingOut}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{loggingOut ? "Signing out..." : "Sign Out of Platform"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Operational Bar (Desktop) */}
          <header className="bg-card/40 sticky top-0 z-30 hidden h-14 items-center justify-between border-b px-6 backdrop-blur-md md:flex">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 font-mono text-xs font-medium text-red-500 shadow-2xs">
                <Radio className="h-3 w-3 animate-pulse text-red-500" />
                SaaS Operational Surface &bull; Zero-Standing Customer Privileges
              </span>
            </div>

            <div className="flex items-center gap-3">
              {activeSupportCount > 0 && (
                <Badge
                  variant="destructive"
                  className="gap-1.5 bg-emerald-600 px-2.5 py-1 font-mono text-xs text-white"
                >
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
                  {activeSupportCount} Active Support Delegation
                </Badge>
              )}
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                disabled={loggingOut}
                className="border-border/80 h-8 gap-1.5 text-xs hover:border-red-500/40 hover:text-red-500"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </div>
          </header>

          {/* Content Body */}
          <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</main>
        </div>

        <PlatformTwoFactorDialog open={twoFactorOpen} onOpenChange={setTwoFactorOpen} />
      </div>
    </TooltipProvider>
  );
}
