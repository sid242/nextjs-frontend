"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useServerSentEvents } from "@/lib/hooks";

import { filesKeys } from "./keys";

/**
 * Server-Sent Events (SSE) alternative to WebSockets for file processing notifications.
 * Connects directly through the same-origin Next.js BFF proxy to /api/proxy/files/events/stream.
 */
export function useFileSse(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  useServerSentEvents("/api/proxy/files/events/stream", {
    enabled: options?.enabled ?? true,
    eventListeners: {
      "file:processed": () => {
        toast.success("A file finished processing");
        void queryClient?.invalidateQueries?.({ queryKey: filesKeys.all });
      },
    },
  });
}
