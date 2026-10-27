"use client";

import { useEffect } from "react";

export interface SseOptions<T = unknown> {
  enabled?: boolean;
  onMessage?: (data: T) => void;
  onError?: (err: Event) => void;
  onOpen?: (e: Event) => void;
  eventListeners?: Record<string, (payload: unknown) => void>;
}

/**
 * Universal Server-Sent Events (SSE) hook for real-time unidirectional streaming.
 * Provides resilient, proxy-friendly streaming over standard HTTP without WebSocket ticket handshakes.
 */
export function useServerSentEvents(url: string | null | undefined, options: SseOptions = {}) {
  const { enabled = true, onMessage, onError, onOpen, eventListeners } = options;

  useEffect(() => {
    if (!enabled || !url) return;

    let source: EventSource | null = null;
    try {
      source = new EventSource(url, { withCredentials: true });
    } catch {
      return;
    }

    source.onopen = (e) => {
      onOpen?.(e);
    };

    source.onerror = (e) => {
      onError?.(e);
    };

    source.onmessage = (e) => {
      if (!onMessage) return;
      try {
        const parsed: unknown = JSON.parse(e?.data);
        onMessage?.(parsed as Parameters<NonNullable<typeof onMessage>>[0]);
      } catch {
        onMessage?.(e?.data as Parameters<NonNullable<typeof onMessage>>[0]);
      }
    };

    // Attach named SSE event listeners
    const cleanups: (() => void)[] = [];
    if (eventListeners) {
      for (const [eventName, handler] of Object.entries(eventListeners)) {
        const listener = (event: MessageEvent) => {
          try {
            const parsed: unknown = JSON.parse(event?.data);
            handler?.(parsed);
          } catch {
            handler?.(event?.data);
          }
        };
        source.addEventListener(eventName, listener);
        cleanups.push(() => source?.removeEventListener(eventName, listener));
      }
    }

    return () => {
      for (const cleanup of cleanups) {
        cleanup?.();
      }
      source?.close?.();
    };
  }, [url, enabled, onMessage, onError, onOpen, eventListeners]);
}
