import { describe, expect, it } from "vitest";

import { getPushSupportStatus, isIosDevice, urlBase64ToUint8Array } from "./push-client";
import { pushDeviceSchema } from "./schemas";

describe("Push Notifications client helpers and schemas", () => {
  it("detects iOS devices and requires standalone mode on iOS Safari", () => {
    const iosUa =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";
    expect(isIosDevice(iosUa)).toBe(true);
    expect(isIosDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0")).toBe(false);

    expect(
      getPushSupportStatus({
        hasServiceWorker: true,
        hasPushManager: true,
        hasNotificationApi: true,
        notificationPermission: "default",
        userAgent: iosUa,
        isStandalone: false,
      }),
    ).toBe("ios-install-required");

    expect(
      getPushSupportStatus({
        hasServiceWorker: true,
        hasPushManager: true,
        hasNotificationApi: true,
        notificationPermission: "default",
        userAgent: iosUa,
        isStandalone: true,
      }),
    ).toBe("default");
  });

  it("reports unsupported, denied, granted, and default permission states accurately", () => {
    const desktopUa = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0";

    expect(
      getPushSupportStatus({
        hasServiceWorker: false,
        hasPushManager: true,
        hasNotificationApi: true,
        notificationPermission: "default",
        userAgent: desktopUa,
        isStandalone: false,
      }),
    ).toBe("unsupported");

    expect(
      getPushSupportStatus({
        hasServiceWorker: true,
        hasPushManager: true,
        hasNotificationApi: true,
        notificationPermission: "denied",
        userAgent: desktopUa,
        isStandalone: false,
      }),
    ).toBe("denied");

    expect(
      getPushSupportStatus({
        hasServiceWorker: true,
        hasPushManager: true,
        hasNotificationApi: true,
        notificationPermission: "granted",
        userAgent: desktopUa,
        isStandalone: false,
      }),
    ).toBe("granted");
  });

  it("decodes URL-safe base64 VAPID keys into Uint8Array", () => {
    const sample = "SGVsbG8td29ybGRf"; // "Hello-world_" in base64url
    const decoded = urlBase64ToUint8Array(sample);
    expect(decoded).toBeInstanceOf(Uint8Array);
    expect(decoded.length).toBeGreaterThan(0);

    const parsed = pushDeviceSchema.parse({
      id: "11111111-1111-4111-8111-111111111111",
      channel: "webpush",
      platform: "web",
      failureCount: 0,
      createdAt: "2026-11-25T10:00:00.000Z",
    });
    expect(parsed.channel).toBe("webpush");
  });
});
