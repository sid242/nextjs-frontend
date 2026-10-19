"use client";

import { Badge } from "@/components/ui/badge";

import { useConnectionStatus } from "../use-socket";

/** Small header indicator for the realtime connection. Renders nothing when there's nothing useful to say. */
export function ConnectionStatus() {
  const status = useConnectionStatus();

  switch (status) {
    case "connected":
      return <Badge variant="success">Live</Badge>;
    case "connecting":
      return <Badge variant="secondary">Connecting…</Badge>;
    case "reconnecting":
      return <Badge variant="warning">Reconnecting…</Badge>;
    case "unavailable":
      return <Badge variant="outline">Realtime unavailable</Badge>;
    default:
      return null; // idle, or unauthorized (the session flow redirects to /login)
  }
}
