import type { Socket } from "socket.io-client";

/**
 * Typed Socket.IO contract: keep in sync with the backend (src/sockets/index.js and workers' emitToUser calls).
 * Add an event here first and every emit()/on() call site is type-checked.
 */
export interface ServerToClientEvents {
  /** Emitted by the file worker when background processing finishes. */
  "file:processed": (payload: {
    fileId: string;
    tenantId: string;
    scanStatus: "CLEAN" | "INFECTED" | "FAILED";
  }) => void;
  "room:message": (payload: { roomId: string; text: string; from: string; at: number }) => void;
  /** Emitted by notification service when new notification is dispatched. */
  "notification:new": (payload: {
    id: string;
    type: string;
    category?: string;
    severity?: string;
    title: string;
    body: string;
    link?: string | null;
    createdAt: string;
  }) => void;
}

export interface ClientToServerEvents {
  "room:join": (payload: { roomId: string }, ack?: (response: { ok: boolean }) => void) => void;
  "room:leave": (payload: { roomId: string }) => void;
  "room:message": (payload: { roomId: string; text: string }) => void;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
