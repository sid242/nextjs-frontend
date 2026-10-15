"use client";

import { useRealtimeStore, type SocketStatus } from "./store";
import type { AppSocket } from "./events";

/** The live socket (null until connected / outside the authenticated area). */
export const useSocket = (): AppSocket | null => useRealtimeStore((state) => state.socket);

export const useConnectionStatus = (): SocketStatus => useRealtimeStore((state) => state.status);
