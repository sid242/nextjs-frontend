"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "./api";
import type { Announcement } from "./types";

export const announcementKeys = {
  all: ["announcements"] as const,
  active: (tenantId?: string) => [...announcementKeys.all, "active", tenantId] as const,
  changelog: (page: number, limit: number) =>
    [...announcementKeys.all, "changelog", page, limit] as const,
};

export function useActiveAnnouncements(tenantId?: string) {
  return useQuery({
    queryKey: announcementKeys.active(tenantId),
    queryFn: () => api.getActiveAnnouncements(tenantId),
    staleTime: 60 * 1000,
  });
}

export function useDismissAnnouncement(tenantId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (announcementId: string) => api.dismissAnnouncement(announcementId),
    onSuccess: (_, announcementId) => {
      queryClient.setQueryData<Announcement[]>(announcementKeys.active(tenantId), (old) => {
        if (!Array.isArray(old)) return [];
        return old.filter((item) => item.id !== announcementId);
      });
    },
  });
}

export function useChangelog(page = 1, limit = 20) {
  return useQuery({
    queryKey: announcementKeys.changelog(page, limit),
    queryFn: () => api.listChangelog(page, limit),
    staleTime: 5 * 60 * 1000,
  });
}
