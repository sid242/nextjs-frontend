"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  archiveNotification,
  deleteNotification,
  getNotificationPreferences,
  getNotifications,
  getPushPublicKey,
  getUnreadCount,
  listPushDevices,
  markAllNotificationsRead,
  markNotificationRead,
  removePushDevice,
  sendTestPush,
  updateNotificationPreferences,
  type PushScope,
} from "./api";
import { notificationKeys } from "./keys";
import { disableBrowserPush, enableBrowserPush } from "./push-client";
import type { NotificationItem, NotificationPreference } from "./schemas";

export const notificationsQueryOptions = () =>
  queryOptions({
    queryKey: notificationKeys.list(),
    queryFn: ({ signal }) => getNotifications(signal),
    staleTime: 30 * 1000,
  });

export const unreadCountQueryOptions = () =>
  queryOptions({
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) => getUnreadCount(signal),
    staleTime: 15 * 1000,
  });

export const notificationPreferencesQueryOptions = () =>
  queryOptions({
    queryKey: notificationKeys.preferences(),
    queryFn: ({ signal }) => getNotificationPreferences(signal),
    staleTime: 60 * 1000,
  });

export function useNotifications() {
  return useQuery(notificationsQueryOptions());
}

export function useUnreadCount() {
  return useQuery(unreadCountQueryOptions());
}

export function useNotificationPreferences() {
  return useQuery(notificationPreferencesQueryOptions());
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<NotificationItem[]>(notificationKeys.list(), (old = []) =>
        old.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n)),
      );
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category?: string) => markAllNotificationsRead(category),
    onSuccess: () => {
      queryClient.setQueryData<NotificationItem[]>(notificationKeys.list(), (old = []) =>
        old.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() })),
      );
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

export function useArchiveNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveNotification(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<NotificationItem[]>(notificationKeys.list(), (old = []) =>
        old.filter((n) => n.id !== id),
      );
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<NotificationItem[]>(notificationKeys.list(), (old = []) =>
        old.filter((n) => n.id !== id),
      );
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prefs: NotificationPreference[]) => updateNotificationPreferences(prefs),
    onSuccess: (data) => {
      queryClient.setQueryData(notificationKeys.preferences(), data);
    },
  });
}

export function usePushPublicKey(scope: PushScope = "tenant") {
  return useQuery({
    queryKey: notificationKeys.pushPublicKey(scope),
    queryFn: ({ signal }) => getPushPublicKey(scope, signal),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePushDevices(scope: PushScope = "tenant") {
  return useQuery({
    queryKey: notificationKeys.pushDevices(scope),
    queryFn: ({ signal }) => listPushDevices(scope, signal),
    staleTime: 30 * 1000,
  });
}

export function useEnableBrowserPush(scope: PushScope = "tenant") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => enableBrowserPush(scope),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.pushDevices(scope) });
    },
  });
}

export function useDisableBrowserPush(scope: PushScope = "tenant") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => disableBrowserPush(scope),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.pushDevices(scope) });
    },
  });
}

export function useRemovePushDevice(scope: PushScope = "tenant") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => removePushDevice(scope, deviceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.pushDevices(scope) });
    },
  });
}

export function useSendTestPush(scope: PushScope = "tenant") {
  return useMutation({
    mutationFn: () => sendTestPush(scope),
  });
}
