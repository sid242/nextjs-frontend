"use client";

import { type ReactNode } from "react";

import { Breadcrumbs } from "@/components/molecules/breadcrumbs";
import { GlobalSearch } from "@/components/molecules/global-search";
import { OfflineBanner } from "@/components/molecules/offline-banner";
import { ThemeToggle } from "@/components/molecules/theme-toggle";

import { AppSidebar } from "./app-sidebar";
import { MobileSidebar } from "./mobile-sidebar";

interface AppShellProps {
  children: ReactNode;
  /** Slot for the user avatar dropdown menu in the navbar */
  userMenu: ReactNode;
  /** Slot for the user profile footer in the sidebar */
  userProfile?: ReactNode;
  /** Slot for organization / tenant switcher dropdown */
  tenantSwitcher?: ReactNode;
  /** Slot for dynamic tenant company logo / name */
  tenantBrand?: ReactNode;
  /** Slot for real-time notification bell dropdown */
  notifications?: ReactNode;
  /** Optional slot for status indicator (e.g. Socket.IO connection status) */
  headerSlot?: ReactNode;
  /** Optional top banner (e.g. Impersonation banner) */
  topBanner?: ReactNode;
}

/**
 * Authenticated layout: collapsible sidebar on desktop, sliding drawer on mobile.
 * Decoupled from feature implementations via slots.
 */
export function AppShell({
  children,
  userMenu,
  userProfile,
  tenantSwitcher,
  tenantBrand,
  notifications,
  headerSlot,
  topBanner,
}: AppShellProps) {
  return (
    <div className="bg-background flex min-h-screen">
      {/* Desktop Collapsible Sidebar */}
      <AppSidebar tenantSwitcher={tenantSwitcher} userProfile={userProfile} />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {topBanner}
        <OfflineBanner />

        {/* Global Navbar / Header */}
        <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b px-4 backdrop-blur-md">
          {/* Left section: Mobile hamburger + Breadcrumbs */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <MobileSidebar
              tenantBrand={tenantBrand}
              tenantSwitcher={tenantSwitcher}
              userProfile={userProfile}
            />

            <Breadcrumbs />
          </div>

          {/* Right section: Global Search + Status + Notifications + Theme + User Menu */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
            <GlobalSearch />
            {headerSlot}
            {notifications}
            <ThemeToggle />
            {userMenu}
          </div>
        </header>

        {/* Page Content */}
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
