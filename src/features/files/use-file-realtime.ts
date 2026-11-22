"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useSocketEvent } from "@/features/realtime";
import { useActiveTenant } from "@/features/tenants";

import { filesKeys } from "./keys";

/** The worker emits `file:processed` when background processing finishes: refresh the list and tell the user. */
export function useFileRealtime() {
  const queryClient = useQueryClient();
  const { activeTenant } = useActiveTenant();
  useSocketEvent("file:processed", ({ tenantId, scanStatus }) => {
    if (!activeTenant || activeTenant.id !== tenantId) return;
    if (scanStatus === "CLEAN") toast.success("A file is available");
    if (scanStatus === "INFECTED") toast.error("A file was quarantined");
    if (scanStatus === "FAILED") toast.error("A file could not be scanned");
    void queryClient.invalidateQueries({ queryKey: filesKeys.workspace(activeTenant.slug) });
  });
}
