"use client";

import { api } from "@/lib/api/http";

import type {
  NotificationCategory,
  NotificationItem,
  NotificationPreference,
  NotificationSeverity,
  NotificationType,
} from "./schemas";

interface BackendNotificationRecord {
  id: string;
  tenantId?: string | null;
  type: string;
  category?: string;
  severity?: string;
  title: string;
  body: string;
  link?: string | null;
  data?: Record<string, unknown>;
  readAt?: string | null;
  archivedAt?: string | null;
  createdAt: string;
}

interface BackendNotificationsResponse {
  items: BackendNotificationRecord[];
  nextCursor?: string;
  totalUnread: number;
}

function mapSeverityToType(severity?: string, type?: string): NotificationType {
  const sev = (severity ?? "").toLowerCase();
  if (sev === "critical") return "error";
  if (sev === "warning") return "warning";
  if (sev === "success") return "success";
  if (type?.includes("warning") || type?.includes("failed")) return "warning";
  if (type?.includes("error")) return "error";
  return "info";
}

export async function getNotifications(signal?: AbortSignal): Promise<NotificationItem[]> {
  const res = await api.get<BackendNotificationsResponse | BackendNotificationRecord[]>(
    "/notifications",
    { signal },
  );

  const rawList: BackendNotificationRecord[] = Array.isArray(res) ? res : (res?.items ?? []);

  return rawList.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.body,
    body: n.body,
    type: mapSeverityToType(n.severity, n.type),
    category: (n.category ?? "SYSTEM") as NotificationCategory,
    severity: (n.severity ?? "INFO") as NotificationSeverity,
    read: Boolean(n.readAt),
    readAt: n.readAt ?? null,
    createdAt: n.createdAt,
    link: n.link ?? null,
  }));
}

export async function getUnreadCount(signal?: AbortSignal): Promise<number> {
  const res = await api.get<{ unreadCount: number }>("/notifications/unread-count", { signal });
  return res?.unreadCount ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(category?: string): Promise<void> {
  await api.post("/notifications/read-all", { category });
}

export async function archiveNotification(id: string): Promise<void> {
  await api.post(`/notifications/${id}/archive`);
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}

export async function getNotificationPreferences(
  signal?: AbortSignal,
): Promise<NotificationPreference[]> {
  const res = await api.get<{ preferences: NotificationPreference[] }>(
    "/notifications/preferences",
    { signal },
  );
  return res?.preferences ?? [];
}

export async function updateNotificationPreferences(
  preferences: NotificationPreference[],
): Promise<NotificationPreference[]> {
  const res = await api.put<{ preferences: NotificationPreference[] }>(
    "/notifications/preferences",
    { preferences },
  );
  return res?.preferences ?? [];
}
