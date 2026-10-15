"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSocketEvent } from "@/features/realtime";
import { filesKeys } from "./keys";

/** The worker emits `file:processed` when background processing finishes: refresh the list and tell the user. */
export function useFileRealtime() {
  const queryClient = useQueryClient();
  useSocketEvent("file:processed", () => {
    toast.success("A file finished processing");
    void queryClient.invalidateQueries({ queryKey: filesKeys.all });
  });
}
