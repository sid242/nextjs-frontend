"use client";

import { WifiOffIcon } from "lucide-react";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      className="bg-warning/20 text-foreground flex items-center justify-center gap-2 px-4 py-2 text-sm"
    >
      <WifiOffIcon className="size-4" />
      You&apos;re offline. Some actions won&apos;t work until you reconnect.
    </div>
  );
}
