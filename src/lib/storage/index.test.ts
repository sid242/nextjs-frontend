import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ACTIVE_TENANT_COOKIE_KEY,
  ACTIVE_TENANT_STORAGE_KEY,
  clientCookie,
  clientStorage,
  tenantStorage,
} from "./index";

describe("clientStorage in Node / SSR environment", () => {
  it("returns safe defaults when window is undefined", () => {
    expect(clientStorage.getItem("test")).toBeNull();
    expect(clientStorage.setItem("test", "val")).toBe(false);
    expect(clientStorage.getJSON("test", { default: true })).toEqual({ default: true });
    expect(clientStorage.removeItem("test")).toBe(false);
    expect(clientStorage.clear()).toBe(false);
  });

  it("returns safe defaults for cookies when document is undefined", () => {
    expect(clientCookie.get("test")).toBeNull();
    expect(() => clientCookie.set("test", "val")).not.toThrow();
    expect(() => clientCookie.remove("test")).not.toThrow();
  });
});

describe("clientStorage & tenantStorage in Browser environment", () => {
  let mockStore: Record<string, string> = {};
  let mockCookies: string[] = [];

  beforeEach(() => {
    mockStore = {};
    mockCookies = [];

    // Mock localStorage
    const mockLocalStorage = {
      getItem: (k: string) => mockStore[k] ?? null,
      setItem: (k: string, v: string) => {
        mockStore[k] = String(v);
      },
      removeItem: (k: string) => {
        delete mockStore[k];
      },
      clear: () => {
        mockStore = {};
      },
    };

    (globalThis as unknown as { window: unknown }).window = {
      localStorage: mockLocalStorage,
    };

    // Mock document.cookie
    Object.defineProperty(globalThis, "document", {
      writable: true,
      configurable: true,
      value: {
        get cookie() {
          return mockCookies.join("; ");
        },
        set cookie(val: string) {
          const parts = val.split(";")[0]?.trim();
          if (parts) {
            const [k, v] = parts.split("=");
            if (val.includes("max-age=0")) {
              mockCookies = mockCookies.filter((c) => !c.startsWith(`${k}=`));
            } else {
              mockCookies = mockCookies.filter((c) => !c.startsWith(`${k}=`));
              mockCookies.push(`${k}=${v}`);
            }
          }
        },
      },
    });
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).document;
  });

  it("sets, gets, and removes string items safely", () => {
    expect(clientStorage.getItem("test-key")).toBeNull();
    clientStorage.setItem("test-key", "hello-world");
    expect(clientStorage.getItem("test-key")).toBe("hello-world");
    clientStorage.removeItem("test-key");
    expect(clientStorage.getItem("test-key")).toBeNull();
  });

  it("handles JSON serialization and deserialization with fallbacks", () => {
    const payload = { userId: "usr-1", roles: ["ADMIN"] };
    clientStorage.setJSON("user-meta", payload);
    expect(clientStorage.getJSON("user-meta")).toEqual(payload);

    // Invalid JSON fallback
    window.localStorage.setItem("corrupt-key", "{ invalid json");
    expect(clientStorage.getJSON("corrupt-key", { default: true })).toEqual({ default: true });
  });

  it("clears all storage keys", () => {
    clientStorage.setItem("k1", "v1");
    clientStorage.setItem("k2", "v2");
    clientStorage.clear();
    expect(clientStorage.getItem("k1")).toBeNull();
    expect(clientStorage.getItem("k2")).toBeNull();
  });

  it("sets, gets, and removes cookies safely", () => {
    clientCookie.set("session_test", "xyz-token");
    expect(clientCookie.get("session_test")).toBe("xyz-token");
    clientCookie.remove("session_test");
    expect(clientCookie.get("session_test")).toBeNull();
  });

  it("synchronizes both localStorage and document.cookie when setting tenant", () => {
    const tenantId = "tenant-uuid-12345";
    tenantStorage.set(tenantId);

    expect(clientStorage.getItem(ACTIVE_TENANT_STORAGE_KEY)).toBe(tenantId);
    expect(clientCookie.get(ACTIVE_TENANT_COOKIE_KEY)).toBe(tenantId);
    expect(tenantStorage.get()).toBe(tenantId);
  });

  it("atomically clears both localStorage and document.cookie", () => {
    tenantStorage.set("tenant-uuid-12345");
    tenantStorage.clear();

    expect(clientStorage.getItem(ACTIVE_TENANT_STORAGE_KEY)).toBeNull();
    expect(clientCookie.get(ACTIVE_TENANT_COOKIE_KEY)).toBeNull();
    expect(tenantStorage.get()).toBeNull();
  });

  it("purges and ignores legacy 'tenant-acme'", () => {
    window.localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, "tenant-acme");
    expect(tenantStorage.get()).toBeNull();
    expect(window.localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY)).toBeNull();
  });
});
