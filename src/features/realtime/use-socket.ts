"use client";

import type { AppSocket } from "./events";
import { useRealtimeStore, type SocketStatus } from "./store";

/** The live socket (null until connected / outside the authenticated area). */
export const useSocket = (): AppSocket | null => useRealtimeStore((state) => state.socket);

export const useConnectionStatus = (): SocketStatus => useRealtimeStore((state) => state.status);
