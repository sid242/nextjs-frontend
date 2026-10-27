import { type ReactNode } from "react";
import { cookies } from "next/headers";

import { AppShell } from "@/components/organisms/app-shell";
import { ImpersonationBanner, UserMenu, UserProfileFooter } from "@/features/auth";
import { NotificationBell } from "@/features/notifications";
import { SupportSessionBanner } from "@/features/platform";
import { ConnectionStatus, SocketProvider } from "@/features/realtime";
import { TenantSidebarNav, TenantSwitcher, TenantThemeProvider } from "@/features/tenants";
import { SUPPORT_SESSION_COOKIE } from "@/lib/auth/constants";
import { isImpersonating, requireUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser(); // refreshes the session or redirects to /login
  const impersonating = await isImpersonating();
  const cookieStore = await cookies();
  const supportSessionId = cookieStore.get(SUPPORT_SESSION_COOKIE)?.value;

  const topBanner = supportSessionId ? (
    <SupportSessionBanner sessionId={supportSessionId} />
  ) : impersonating ? (
    <ImpersonationBanner userName={user.name} />
  ) : null;

  return (
    <SocketProvider>
      <TenantThemeProvider>
        <AppShell
          userMenu={<UserMenu user={user} />}
          userProfile={<UserProfileFooter user={user} />}
          tenantSwitcher={<TenantSwitcher />}
          notifications={<NotificationBell />}
          headerSlot={<ConnectionStatus />}
          topBanner={topBanner}
          navigationSlot={<TenantSidebarNav />}
          mobileNavigationSlot={({ onNavigate }) => <TenantSidebarNav onNavigate={onNavigate} />}
        >
          {children}
        </AppShell>
      </TenantThemeProvider>
    </SocketProvider>
  );
}
