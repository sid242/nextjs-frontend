/* eslint-disable no-restricted-globals */
// Service Worker for Web Push notifications (tenant workspace & platform operator scopes)

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {
    title: "New notification",
    body: "Open the app to view details.",
    link: "/",
    tag: "app-notification",
  };

  try {
    const parsed = event.data.json();
    if (parsed && typeof parsed === "object") {
      payload = {
        title: typeof parsed.title === "string" && parsed.title ? parsed.title : payload.title,
        body: typeof parsed.body === "string" ? parsed.body : payload.body,
        link: typeof parsed.link === "string" && parsed.link ? parsed.link : "/",
        tag:
          typeof parsed.tag === "string" && parsed.tag
            ? parsed.tag
            : typeof parsed.notificationId === "string"
              ? parsed.notificationId
              : payload.tag,
      };
    }
  } catch {
    const text = event.data.text();
    if (text) payload.body = text;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url: payload.link },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawUrl = (event.notification.data && event.notification.data.url) || "/";
  let targetUrl;
  try {
    targetUrl = new URL(rawUrl, self.location.origin);
    if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
      targetUrl = new URL("/", self.location.origin);
    }
  } catch {
    targetUrl = new URL("/", self.location.origin);
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(targetUrl.origin) && "focus" in client) {
          return client.focus().then((focused) => {
            if (focused && "navigate" in focused && client.url !== targetUrl.href) {
              return focused.navigate(targetUrl.href);
            }
            return focused;
          });
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl.href);
      }
      return undefined;
    }),
  );
});
