import { type ReactNode } from "react";

import { AppShell } from "@/components/organisms/app-shell";
import { ImpersonationBanner, UserMenu, UserProfileFooter } from "@/features/auth";
import { NotificationBell } from "@/features/notifications";
import { ConnectionStatus, SocketProvider } from "@/features/realtime";
import { TenantBrand, TenantSwitcher } from "@/features/tenants";
import { isImpersonating, requireUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser(); // refreshes the session or redirects to /login
  const impersonating = await isImpersonating();

  return (
    <SocketProvider>
      <AppShell
        userMenu={<UserMenu user={user} />}
        userProfile={<UserProfileFooter user={user} />}
        tenantSwitcher={<TenantSwitcher />}
        tenantBrand={<TenantBrand />}
        notifications={<NotificationBell />}
        headerSlot={<ConnectionStatus />}
        topBanner={impersonating ? <ImpersonationBanner userName={user.name} /> : null}
      >
        {children}
      </AppShell>
    </SocketProvider>
  );
}
