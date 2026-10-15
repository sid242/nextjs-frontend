import { AppShell } from "@/components/organisms/app-shell";
import { UserMenu } from "@/features/auth";
import { ConnectionStatus, SocketProvider } from "@/features/realtime";
import { requireUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(); // refreshes the session or redirects to /login

  return (
    <SocketProvider>
      <AppShell userMenu={<UserMenu user={user} />} headerSlot={<ConnectionStatus />}>
        {children}
      </AppShell>
    </SocketProvider>
  );
}
