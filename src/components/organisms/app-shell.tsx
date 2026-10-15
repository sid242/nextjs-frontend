import * as React from "react";
import { OfflineBanner } from "@/components/molecules/offline-banner";
import { ThemeToggle } from "@/components/molecules/theme-toggle";
import { AppSidebar } from "./app-sidebar";
import { SidebarNav } from "./sidebar-nav";

interface AppShellProps {
  children: React.ReactNode;
  /** Slot for the signed-in user's menu (supplied by the auth feature at the route layer). */
  userMenu: React.ReactNode;
  /** Optional slot before the theme toggle, e.g. the realtime connection indicator. */
  headerSlot?: React.ReactNode;
}

/**
 * Authenticated layout: sidebar on desktop, compact nav on mobile.
 * It knows nothing about features; routes pass feature UI in through slots.
 */
export function AppShell({ children, userMenu, headerSlot }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <OfflineBanner />
        <header className="flex h-14 items-center justify-between gap-4 border-b px-4">
          <div className="min-w-0 md:hidden">
            <SidebarNav orientation="horizontal" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            {headerSlot}
            <ThemeToggle />
            {userMenu}
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
