import { create } from "zustand";

import type { AppSocket } from "./events";

export type SocketStatus =
  "idle" | "connecting" | "connected" | "reconnecting" | "unauthorized" | "unavailable";

interface RealtimeState {
  socket: AppSocket | null;
  status: SocketStatus;
  setSocket: (socket: AppSocket | null) => void;
  setStatus: (status: SocketStatus) => void;
}

/**
 * The live socket and its connection status. Kept in zustand (not React state/context) so the connection
 * lifecycle can be managed outside React's render cycle and any component can read `status` with a selector.
 */
export const useRealtimeStore = create<RealtimeState>()((set) => ({
  socket: null,
  status: "idle",
  setSocket: (socket) => set({ socket }),
  setStatus: (status) => set({ status }),
}));
