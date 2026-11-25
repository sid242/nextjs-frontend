import { TenantChatView } from "@/features/chat";
import { requireUser } from "@/lib/auth/session";

export const metadata = {
  title: "Team Chat",
  description: "Real-time workspace channels, direct messages, and file sharing.",
};

export default async function TenantChatPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string }>;
}) {
  const [user, resolvedSearchParams] = await Promise.all([requireUser(), searchParams]);

  return (
    <TenantChatView
      currentUserId={user.id}
      initialChannelId={resolvedSearchParams?.channel ?? null}
    />
  );
}
