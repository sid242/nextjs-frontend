import { api } from "@/lib/api/http";

import type { NotificationItem } from "./schemas";

let memoryNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "New team member invited",
    message: "Sarah Connor has been invited to join Acme Corporation as an Administrator.",
    type: "info",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    link: "/team",
  },
  {
    id: "notif-2",
    title: "SMTP configuration verified",
    message: "Custom SMTP settings were successfully tested and verified.",
    type: "success",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    link: "/settings/email",
  },
  {
    id: "notif-3",
    title: "Branding updated",
    message: "Company logo and primary brand colors have been refreshed.",
    type: "info",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    link: "/branding",
  },
];

export async function getNotifications(signal?: AbortSignal): Promise<NotificationItem[]> {
  try {
    const data = await api.get<NotificationItem[]>("/notifications", { signal });
    return data?.length ? data : memoryNotifications;
  } catch {
    return memoryNotifications;
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await api.patch(`/notifications/${id}/read`);
  } catch {
    // In-memory fallback
    memoryNotifications = memoryNotifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  try {
    await api.post("/notifications/read-all");
  } catch {
    // In-memory fallback
    memoryNotifications = memoryNotifications.map((n) => ({ ...n, read: true }));
  }
}
