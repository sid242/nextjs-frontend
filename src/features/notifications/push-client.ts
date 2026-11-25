"use client";

import {
  getPushPublicKey,
  subscribePushDevice,
  unsubscribePushDevice,
  type PushScope,
} from "./api";

export type PushSupportStatus =
  "unsupported" | "ios-install-required" | "denied" | "granted" | "default";

export interface PushEnvironmentSnapshot {
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasNotificationApi: boolean;
  notificationPermission?: NotificationPermission;
  userAgent: string;
  isStandalone: boolean;
}

export function getBrowserPushEnvironment(): PushEnvironmentSnapshot {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      hasServiceWorker: false,
      hasPushManager: false,
      hasNotificationApi: false,
      userAgent: "",
      isStandalone: false,
    };
  }

  const nav = navigator as Navigator & { standalone?: boolean };
  const isStandalone =
    Boolean(nav.standalone) ||
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches);

  return {
    hasServiceWorker: "serviceWorker" in navigator,
    hasPushManager: "PushManager" in window,
    hasNotificationApi: "Notification" in window,
    notificationPermission: "Notification" in window ? Notification.permission : undefined,
    userAgent: navigator.userAgent ?? "",
    isStandalone,
  };
}

export function isIosDevice(userAgent: string): boolean {
  return /iphone|ipad|ipod/i.test(userAgent);
}

export function getPushSupportStatus(
  env: PushEnvironmentSnapshot = getBrowserPushEnvironment(),
): PushSupportStatus {
  if (isIosDevice(env.userAgent) && !env.isStandalone) {
    return "ios-install-required";
  }
  if (!env.hasServiceWorker || !env.hasPushManager || !env.hasNotificationApi) {
    return "unsupported";
  }
  if (env.notificationPermission === "denied") {
    return "denied";
  }
  if (env.notificationPermission === "granted") {
    return "granted";
  }
  return "default";
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function getActivePushSubscription(): Promise<PushSubscription | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!registration || !("pushManager" in registration)) return null;
  return registration.pushManager.getSubscription();
}

export async function enableBrowserPush(scope: PushScope): Promise<{
  subscribed: boolean;
  id: string;
  endpoint: string;
}> {
  const status = getPushSupportStatus();
  if (status === "unsupported") {
    throw new Error("Push notifications are not supported in this browser.");
  }
  if (status === "ios-install-required") {
    throw new Error("On iOS Safari, add this app to your Home Screen first to enable push.");
  }

  // Request permission only on explicit user interaction
  const permission =
    Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Browser notification permission was denied.");
  }

  const keyConfig = await getPushPublicKey(scope);
  if (!keyConfig.enabled || !keyConfig.publicKey) {
    throw new Error("Push notifications are not enabled on this server (missing VAPID key).");
  }

  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyConfig.publicKey),
    });
  }

  const serialized = subscription.toJSON();
  const p256dh = serialized.keys?.p256dh;
  const auth = serialized.keys?.auth;
  if (!subscription.endpoint || !p256dh || !auth) {
    throw new Error("Browser failed to generate valid Web Push encryption keys.");
  }

  const res = await subscribePushDevice(scope, {
    endpoint: subscription.endpoint,
    keys: { p256dh, auth },
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    platform: "web",
  });

  return { subscribed: res.subscribed, id: res.id, endpoint: subscription.endpoint };
}

export async function disableBrowserPush(scope: PushScope): Promise<{ unsubscribed: boolean }> {
  const subscription = await getActivePushSubscription();
  if (!subscription) {
    return { unsubscribed: false };
  }

  const endpoint = subscription.endpoint;
  try {
    await unsubscribePushDevice(scope, endpoint);
  } finally {
    await subscription.unsubscribe().catch(() => false);
  }
  return { unsubscribed: true };
}

/**
 * Best-effort cleanup called before clearing cookies on logout so shared workstations
 * stop receiving notifications for the previous user.
 */
export async function unsubscribeBrowserPushOnLogout(scope: PushScope): Promise<void> {
  try {
    const subscription = await getActivePushSubscription();
    if (!subscription) return;
    const endpoint = subscription.endpoint;
    await Promise.allSettled([unsubscribePushDevice(scope, endpoint), subscription.unsubscribe()]);
  } catch {
    // Logout must always proceed cleanly even if browser push cleanup fails
  }
}
