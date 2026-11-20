import { api } from "@/lib/api/http";

import type { Announcement, ChangelogEntry } from "./types";

export const getActiveAnnouncements = (tenantId?: string) =>
  api.get<Announcement[]>(`/announcements/active${tenantId ? `?tenantId=${tenantId}` : ""}`);

export const dismissAnnouncement = (announcementId: string) =>
  api.post<{ success: boolean }>(`/announcements/${announcementId}/dismiss`);

export const listChangelog = (page = 1, limit = 20) =>
  api.get<{
    items: ChangelogEntry[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/announcements/changelog?page=${page}&limit=${limit}`);
