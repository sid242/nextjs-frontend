"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getNotifications, markAllNotificationsRead, markNotificationRead } from "./api";
import { notificationKeys } from "./keys";
import type { NotificationItem } from "./schemas";

export const notificationsQueryOptions = () =>
  queryOptions({
    queryKey: notificationKeys.list(),
    queryFn: ({ signal }) => getNotifications(signal),
    staleTime: 30 * 1000,
  });

export function useNotifications() {
  return useQuery(notificationsQueryOptions());
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<NotificationItem[]>(notificationKeys.list(), (old = []) =>
        old.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.setQueryData<NotificationItem[]>(notificationKeys.list(), (old = []) =>
        old.map((n) => ({ ...n, read: true })),
      );
    },
  });
}
