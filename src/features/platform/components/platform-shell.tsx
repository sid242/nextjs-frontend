"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ExternalLink,
  FileText,
  KeyRound,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
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

const NAV_ITEMS: NavItemConfig[] = [
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
    href: "/platform/staff",
    label: "Platform Staff",
    description: "Manage internal operator accounts & status",
    icon: Users,
    permission: PLATFORM_PERMISSION_KEYS.STAFF_READ,
  },
  {
    href: "/platform/roles",
    label: "Roles & Permissions",
    description: "System & custom resource::action catalogue",
    icon: ShieldCheck,
    permission: PLATFORM_PERMISSION_KEYS.ROLES_READ,
  },
  {
    href: "/platform/plans",
    label: "Plans & Entitlements",
    description: "Multi-tenant tiers, seat limits & quotas",
    icon: Layers,
    permission: PLATFORM_PERMISSION_KEYS.BILLING_READ,
  },
  {
    href: "/platform/support-sessions",
    label: "Support Sessions",
    description: "Time-bound, audited tenant delegation",
    icon: LifeBuoy,
    permission: [PLATFORM_PERMISSION_KEYS.SUPPORT_START, PLATFORM_PERMISSION_KEYS.SUPPORT_END],
  },
  {
    href: "/platform/audit-logs",
    label: "Platform Audit Trail",
    description: "Immutable compliance & security logs",
    icon: FileText,
    permission: PLATFORM_PERMISSION_KEYS.AUDIT_READ,
  },
];

export function PlatformShell({ children }: PlatformShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const { data: staff, isLoading: staffLoading } = usePlatformMe();
  const { mutate: logout, isPending: loggingOut } = usePlatformLogout();

  // Filter navigation items by staff permissions
  const visibleNavItems = NAV_ITEMS.filter((item) => hasPlatformPermission(staff, item.permission));

  const canInspectSupport = hasPlatformPermission(staff, [
    PLATFORM_PERMISSION_KEYS.SUPPORT_START,
    PLATFORM_PERMISSION_KEYS.SUPPORT_END,
  ]);

  // Query active support sessions only if staff has permission
  const { data: sessionsData } = useSupportSessions(
    { page: 1, limit: 5 },
    { enabled: canInspectSupport },
  );
  const activeSessions = (sessionsData?.items ?? []).filter((s) => s?.status === "ACTIVE");

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <header className="bg-card/60 sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 bg-red-600/15 font-bold text-red-500">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight">SaaS Platform</span>
            <span className="text-muted-foreground block font-mono text-[10px] tracking-widest uppercase">
              Internal Console
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

      {/* Desktop Sidebar & Mobile Drawer */}
      <aside
        className={`bg-card fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-amber-600 text-white shadow-md shadow-red-500/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight">SaaS Platform</span>
                <Badge
                  variant="outline"
                  className="border-red-500/40 px-1.5 py-0 font-mono text-[9px] text-red-500"
                >
                  STAFF
                </Badge>
              </div>
              <span className="text-muted-foreground block font-mono text-[11px]">
                Platform Security Zone
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Live Active Support Indicator */}
        {activeSessions.length > 0 && (
          <div className="mx-4 mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs">
            <div className="mb-1 flex items-center gap-2 font-semibold text-emerald-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span>Active Support Delegation</span>
            </div>
            <p className="text-muted-foreground text-[11px]">
              {activeSessions.length} active session{activeSessions.length > 1 ? "s" : ""} currently
              authorized.
            </p>
            <Link
              href="/platform/support-sessions"
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500 hover:underline"
            >
              Inspect Active Sessions &rarr;
            </Link>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <div className="text-muted-foreground px-3 pt-2 pb-1.5 font-mono text-[10px] font-semibold tracking-wider uppercase">
            Platform Management
          </div>
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "border border-red-500/20 bg-red-500/10 font-semibold text-red-500"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${isActive ? "text-red-500" : "text-muted-foreground"}`}
                />
                <div className="flex flex-col">
                  <span>{item.label}</span>
                  <span className="text-muted-foreground line-clamp-1 text-[10px] font-normal">
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}

          <div className="text-muted-foreground px-3 pt-4 pb-1 font-mono text-[10px] font-semibold tracking-wider uppercase">
            Navigation
          </div>
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <ExternalLink className="text-muted-foreground h-4 w-4" />
              Customer Tenant App
            </span>
            <Badge variant="secondary" className="px-1 text-[9px]">
              Exit
            </Badge>
          </Link>
        </nav>

        {/* Staff User Footer */}
        <div className="bg-muted/20 border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hover:bg-muted flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/20 text-xs font-bold text-red-500">
                    {staff?.displayName ? (
                      staff.displayName.charAt(0).toUpperCase()
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-xs font-semibold">
                      {staff?.displayName ?? (staffLoading ? "Loading staff..." : "Staff Operator")}
                    </p>
                    <p className="text-muted-foreground truncate font-mono text-[11px]">
                      {staff?.roleKey ?? "PLATFORM_STAFF"}
                    </p>
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
        <header className="bg-card/40 sticky top-0 z-30 hidden h-14 items-center justify-between border-b px-6 backdrop-blur md:flex">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 font-mono text-xs font-medium text-red-500">
              <Radio className="h-3 w-3 animate-pulse" />
              SaaS Operational Surface &bull; Zero-Standing Customer Privileges
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activeSessions.length > 0 && (
              <Badge variant="success" className="gap-1.5 px-2.5 py-1 font-mono text-xs">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500" />
                {activeSessions.length} Active Support Delegation
              </Badge>
            )}
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              disabled={loggingOut}
              className="border-border/80 h-8 gap-1.5 text-xs"
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
  );
}
