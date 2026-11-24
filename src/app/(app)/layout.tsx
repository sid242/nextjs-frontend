import { type ReactNode } from "react";

import { AppShell } from "@/components/organisms/app-shell";
import { AnnouncementBanner } from "@/features/announcements";
import { ImpersonationBanner, UserMenu, UserProfileFooter } from "@/features/auth";
import { NotificationBell } from "@/features/notifications";
import { SupportSessionBanner } from "@/features/platform";
import { CookieBanner } from "@/features/privacy";
import { ConnectionStatus, SocketProvider } from "@/features/realtime";
import { TenantSidebarNav, TenantSwitcher, TenantThemeProvider } from "@/features/tenants";
import { isImpersonating, requireUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser(); // refreshes the session or redirects to /login
  const impersonating = await isImpersonating();

  const topBanner = (
    <>
      <AnnouncementBanner />
      {user.support ? (
        <SupportSessionBanner
          sessionId={user.support.id}
          tenantSlug={user.support.tenantSlug}
          scope={user.support.scope}
          expiresAt={user.support.expiresAt}
        />
      ) : impersonating ? (
        <ImpersonationBanner userName={`${user.firstName} ${user.lastName}`.trim()} />
      ) : null}
    </>
  );

  return (
    <SocketProvider support={Boolean(user.support)}>
      <TenantThemeProvider>
        <AppShell
          userMenu={<UserMenu user={user} />}
          userProfile={<UserProfileFooter user={user} />}
          tenantSwitcher={user.support ? undefined : <TenantSwitcher />}
          notifications={<NotificationBell />}
          headerSlot={<ConnectionStatus />}
          topBanner={topBanner}
          navigationSlot={<TenantSidebarNav />}
        >
          {children}
          <CookieBanner />
        </AppShell>
      </TenantThemeProvider>
    </SocketProvider>
  );
}
