"use client";

import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";

import { isApiError } from "@/lib/api/errors";
import { authApi } from "@/lib/api/http";
import { refreshSession } from "@/lib/api/refresh";
import { sleep } from "@/lib/async";

import type { AppSocket } from "./events";
import { useRealtimeStore, type SocketStatus } from "./store";

interface SocketTicket {
  token: string;
  url: string;
}

// The browser can't read the httpOnly access cookie, so the BFF hands over the (short-lived) token on demand.
const fetchTicket = () => authApi.get<SocketTicket>("/socket-token");

const MAX_TICKET_ATTEMPTS = 5;
const MAX_AUTH_RETRIES = 2;

async function getFirstTicket(
  isDisposed: () => boolean,
): Promise<SocketTicket | Extract<SocketStatus, "unauthorized" | "unavailable">> {
  for (let attempt = 0; attempt < MAX_TICKET_ATTEMPTS; attempt++) {
    try {
      return await fetchTicket();
    } catch (err) {
      if (isApiError(err, 401)) return "unauthorized"; // the session is over: retrying can't help
      await sleep(Math.min(1_000 * 2 ** attempt, 10_000));
      if (isDisposed()) return "unavailable";
    }
  }
  return "unavailable";
}

/**
 * Owns the Socket.IO connection for the authenticated area. Handles the cases that bite in production:
 *  - token expiry: the `auth` callback fetches a FRESH token on every (re)connect
 *  - handshake rejected as "unauthorized": refresh the session, then reconnect (socket.io won't retry this itself)
 *  - server-initiated disconnect: socket.io won't reconnect by itself, so we do
 *  - missed events while disconnected: refetch active queries after a reconnect
 *  - React StrictMode double-mount and logout: everything is torn down in the cleanup
 * Realtime is an enhancement: if it fails the app still works through normal refetching.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const { setSocket, setStatus } = useRealtimeStore.getState();
    let disposed = false;
    let socket: AppSocket | null = null;

    void (async () => {
      setStatus("connecting");
      const ticket = await getFirstTicket(() => disposed);
      if (disposed) return;
      if (typeof ticket === "string") {
        setStatus(ticket);
        return;
      }

      let firstToken: string | null = ticket.token; // use the token we already have for the first handshake
      let authRetries = 0;
      let hasConnectedBefore = false;

      const instance: AppSocket = io(ticket.url, {
        transports: ["websocket"], // no sticky sessions needed behind the load balancer (matches the backend)
        reconnectionDelayMax: 10_000,
        auth: (callback) => {
          if (firstToken) {
            callback({ token: firstToken });
            firstToken = null;
            return;
          }
          fetchTicket()
            .then((fresh) => callback({ token: fresh.token }))
            .catch(() => callback({ token: "" })); // server rejects it -> connect_error handler below recovers
        },
      });
      socket = instance;

      instance.on("connect", () => {
        authRetries = 0;
        setStatus("connected");
        if (hasConnectedBefore) void queryClient.invalidateQueries(); // we may have missed events while away
        hasConnectedBefore = true;
      });

      instance.on("disconnect", (reason) => {
        if (disposed) return;
        setStatus("reconnecting");
        if (reason === "io server disconnect") instance.connect();
      });

      instance.on("connect_error", (error) => {
        if (disposed) return;
        if (error.message !== "unauthorized") {
          setStatus("reconnecting"); // transport problem: socket.io keeps retrying with backoff
          return;
        }
        void (async () => {
          if (authRetries++ < MAX_AUTH_RETRIES && (await refreshSession()) === "ok" && !disposed) {
            instance.connect();
            return;
          }
          if (disposed) return;
          setStatus("unauthorized");
          instance.disconnect();
        })();
      });

      setSocket(instance);
    })();

    return () => {
      disposed = true;
      socket?.removeAllListeners();
      socket?.disconnect();
      setSocket(null);
      setStatus("idle");
    };
  }, [queryClient]);

  return <>{children}</>;
}
