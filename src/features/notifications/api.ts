"use client";

import { api } from "@/lib/api/http";

import type {
  NotificationCategory,
  NotificationItem,
  NotificationPreference,
  NotificationSeverity,
  NotificationType,
  PushDevice,
  PushPublicKeyConfig,
} from "./schemas";

export type PushScope = "tenant" | "platform";

const pushBase = (scope: PushScope) =>
  scope === "platform" ? "/platform/notifications/push" : "/notifications/push";

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

export async function getPushPublicKey(
  scope: PushScope = "tenant",
  signal?: AbortSignal,
): Promise<PushPublicKeyConfig> {
  return api.get<PushPublicKeyConfig>(`${pushBase(scope)}/public-key`, { signal });
}

export async function listPushDevices(
  scope: PushScope = "tenant",
  signal?: AbortSignal,
): Promise<PushDevice[]> {
  const res = await api.get<{ devices: PushDevice[] }>(`${pushBase(scope)}/subscriptions`, {
    signal,
  });
  return res?.devices ?? [];
}

export async function subscribePushDevice(
  scope: PushScope,
  payload: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
    platform?: "web" | "android" | "ios";
    appVersion?: string;
  },
): Promise<{ subscribed: boolean; id: string }> {
  return api.post<{ subscribed: boolean; id: string }>(`${pushBase(scope)}/subscribe`, payload);
}

export async function unsubscribePushDevice(
  scope: PushScope,
  endpoint: string,
): Promise<{ unsubscribed: boolean }> {
  return api.delete<{ unsubscribed: boolean }>(`${pushBase(scope)}/subscribe`, {
    data: { endpoint },
  });
}

export async function removePushDevice(
  scope: PushScope,
  deviceId: string,
): Promise<{ removed: boolean }> {
  return api.delete<{ removed: boolean }>(`${pushBase(scope)}/subscriptions/${deviceId}`);
}

export async function sendTestPush(
  scope: PushScope,
): Promise<{ queued: boolean; deviceCount: number }> {
  return api.post<{ queued: boolean; deviceCount: number }>(`${pushBase(scope)}/test`);
}
