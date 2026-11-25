import { PlatformChatView } from "@/features/chat";

export const metadata = {
  title: "Operator Team Chat",
  description: "Internal platform operator channels and direct messages.",
};

export default async function PlatformChatPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  return <PlatformChatView initialChannelId={resolvedSearchParams?.channel ?? null} />;
}
