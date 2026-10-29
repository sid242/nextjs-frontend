import { describe, expect, it } from "vitest";

import { isAuthPage, isProtectedPath, safeNextPath } from "./paths";

describe("safeNextPath", () => {
  it("keeps safe relative paths", () => {
    expect(safeNextPath("/files?x=1")).toBe("/files?x=1");
  });
  it("rejects open-redirect attempts", () => {
    for (const bad of [
      "//evil.com",
      "/\\evil.com",
      "https://evil.com",
      "javascript:alert(1)",
      "/api/auth/logout",
      "\n/x",
    ]) {
      expect(safeNextPath(bad)).toBe("/dashboard");
    }
  });
  it("falls back when empty", () => {
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath("", "/home")).toBe("/home");
  });
});

describe("route matching", () => {
  it("matches protected sections and their children only", () => {
    expect(isProtectedPath("/files")).toBe(true);
    expect(isProtectedPath("/files/abc")).toBe(true);
    expect(isProtectedPath("/w/acme-corp/dashboard")).toBe(true);
    expect(isProtectedPath("/filesystem")).toBe(false);
    expect(isProtectedPath("/")).toBe(false);
  });
  it("matches auth pages", () => {
    expect(isAuthPage("/login")).toBe(true);
    expect(isAuthPage("/login/x")).toBe(false);
  });
});
