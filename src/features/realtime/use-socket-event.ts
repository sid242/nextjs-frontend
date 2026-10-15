"use client";

import * as React from "react";
import type { ServerToClientEvents } from "./events";
import { useSocket } from "./use-socket";

/**
 * Subscribe to a typed server event for the lifetime of the component.
 *   useSocketEvent("file:processed", ({ fileId }) => ...)
 * The latest handler is always used, so inline arrow functions don't cause re-subscribing.
 */
export function useSocketEvent<E extends keyof ServerToClientEvents>(
  event: E,
  handler: ServerToClientEvents[E],
) {
  const socket = useSocket();
  const handlerRef = React.useRef(handler);

  React.useEffect(() => {
    handlerRef.current = handler;
  });

  React.useEffect(() => {
    if (!socket) return;
    const listener = ((...args: unknown[]) =>
      (handlerRef.current as (...a: unknown[]) => void)(...args)) as ServerToClientEvents[E];
    // socket.io's overloads can't express a generic event key; the public signature above is what keeps callers type-safe.
    socket.on(event, listener as never);
    return () => {
      socket.off(event, listener as never);
    };
  }, [socket, event]);
}
