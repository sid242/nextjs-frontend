"use client";

import { useEffect } from "react";

import { useRealtimeStore } from "./store";
import { useSocket } from "./use-socket";

/**
 * Join a room while mounted. Re-joins automatically after a reconnect, because the server forgets a socket's
 * rooms when it disconnects. NOTE: the backend must authorize who may join which room (see its TODO).
 */
export function useRoom(roomId: string | null) {
  const socket = useSocket();
  const status = useRealtimeStore((state) => state.status);

  useEffect(() => {
    if (!socket || !roomId || status !== "connected") return;
    socket.emit("room:join", { roomId });
    return () => {
      if (socket.connected) socket.emit("room:leave", { roomId });
    };
  }, [socket, roomId, status]);
}
