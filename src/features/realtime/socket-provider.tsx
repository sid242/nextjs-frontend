"use client";

import { useEffect, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";

import { isApiError } from "@/lib/api/errors";
import { authApi, platformAuthApi } from "@/lib/api/http";
import { refreshSession } from "@/lib/api/refresh";
import { sleep } from "@/lib/async";

import type { AppSocket } from "./events";
import { useRealtimeStore, type SocketStatus } from "./store";

interface SocketTicket {
  token: string;
  url: string;
}

type SocketScope = "tenant" | "platform";

const fetchTicket = (scope: SocketScope) =>
  scope === "platform"
    ? platformAuthApi.get<SocketTicket>("/socket-token")
    : authApi.get<SocketTicket>("/socket-token");

const MAX_TICKET_ATTEMPTS = 5;
const MAX_AUTH_RETRIES = 2;

async function getFirstTicket(
  scope: SocketScope,
  isDisposed: () => boolean,
): Promise<SocketTicket | Extract<SocketStatus, "unauthorized" | "unavailable">> {
  for (let attempt = 0; attempt < MAX_TICKET_ATTEMPTS; attempt++) {
    try {
      return await fetchTicket(scope);
    } catch (err) {
      if (isApiError(err, 401)) return "unauthorized";
      await sleep(Math.min(1_000 * 2 ** attempt, 10_000));
      if (isDisposed()) return "unavailable";
    }
  }
  return "unavailable";
}

/**
 * Owns the Socket.IO connection for either the tenant workspace or platform operator area.
 */
export function SocketProvider({
  children,
  support = false,
  scope = "tenant",
}: {
  children: ReactNode;
  support?: boolean;
  scope?: SocketScope;
}) {
  const queryClient = useQueryClient();
  const params = useParams<{ tenantSlug?: string }>();
  const workspaceSlug = scope === "tenant" ? params?.tenantSlug : undefined;

  useEffect(() => {
    const { setSocket, setStatus } = useRealtimeStore.getState();
    let disposed = false;
    let socket: AppSocket | null = null;

    void (async () => {
      setStatus("connecting");
      const ticket = await getFirstTicket(scope, () => disposed);
      if (disposed) return;
      if (typeof ticket === "string") {
        setStatus(ticket);
        return;
      }

      let firstToken: string | null = ticket.token;
      let authRetries = 0;
      let hasConnectedBefore = false;

      const instance: AppSocket = io(ticket.url, {
        transports: ["websocket"],
        reconnectionDelayMax: 10_000,
        auth: (callback) => {
          if (firstToken) {
            callback({ token: firstToken, scope, workspaceSlug });
            firstToken = null;
            return;
          }
          fetchTicket(scope)
            .then((fresh) => callback({ token: fresh.token, scope, workspaceSlug }))
            .catch(() => callback({ token: "" }));
        },
      });
      socket = instance;

      instance.on("connect", () => {
        authRetries = 0;
        setStatus("connected");
        if (hasConnectedBefore) void queryClient.invalidateQueries();
        hasConnectedBefore = true;
      });

      instance.on("disconnect", (reason) => {
        if (disposed) return;
        if (support && reason === "io server disconnect") {
          setStatus("unauthorized");
          return;
        }
        setStatus("reconnecting");
        if (reason === "io server disconnect") instance.connect();
      });

      instance.on("connect_error", (error) => {
        if (disposed) return;
        if (error.message !== "unauthorized") {
          setStatus("reconnecting");
          return;
        }
        void (async () => {
          if (
            scope === "tenant" &&
            !support &&
            authRetries++ < MAX_AUTH_RETRIES &&
            (await refreshSession()) === "ok" &&
            !disposed
          ) {
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
  }, [queryClient, workspaceSlug, support, scope]);

  return <>{children}</>;
}
