import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_COOKIE, PLATFORM_STAFF_COOKIE } from "@/lib/auth/constants";
import * as resolveModule from "@/lib/tenancy/resolve";
import { proxy } from "@/proxy";

vi.mock("@/lib/tenancy/resolve", () => ({
  resolveTenantByHost: vi.fn(),
  resolveTenantBySlug: vi.fn(),
}));

describe("Proxy / Middleware Routing Decision Table", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_BASE_DOMAIN = "example.com";
    process.env.PLATFORM_HOST = "example.com";
  });

  afterEach(() => vi.unstubAllEnvs());

  describe("Subdomain & Custom Domain Host Routing", () => {
    it("rewrites through the original server listener while retaining the public workspace context", async () => {
      // Next sets this flag for skipProxyUrlNormalize in the running server.
      vi.stubEnv("__NEXT_NO_MIDDLEWARE_URL_NORMALIZE", "true");
      vi.mocked(resolveModule.resolveTenantByHost).mockResolvedValueOnce({
        kind: "tenant",
        tenantId: "t-1",
        slug: "acme",
        urlMode: "subdomain",
        canonicalBase: "http://acme.example.com:3001",
        status: "ACTIVE",
      });
      const request = new NextRequest("http://127.0.0.1:3001/dashboard?view=activity", {
        headers: { host: "acme.example.com:3001", cookie: `${ACCESS_COOKIE}=valid-token` },
      });

      const response = await proxy(request);
      expect(response.headers.get("x-middleware-rewrite")).toBe(
        "http://127.0.0.1:3001/w/acme/dashboard?view=activity",
      );
      expect(response.headers.get("x-middleware-request-x-tenant-slug")).toBe("acme");
      expect(response.headers.get("location")).toBeNull();
    });
    it("rewrites to /tenant-not-found when host resolution fails", async () => {
      vi.mocked(resolveModule.resolveTenantByHost).mockResolvedValueOnce(null);

      const req = new NextRequest("http://unknown.example.com/dashboard", {
        headers: { host: "unknown.example.com" },
      });

      const res = await proxy(req);
      expect(res.headers.get("x-middleware-rewrite")).toContain("/tenant-not-found");
    });

    it("rewrites to /tenant-suspended when tenant status is SUSPENDED", async () => {
      vi.mocked(resolveModule.resolveTenantByHost).mockResolvedValueOnce({
        kind: "tenant",
        tenantId: "t-1",
        slug: "acme",
        urlMode: "subdomain",
        canonicalBase: "http://acme.example.com",
        status: "SUSPENDED",
      });

      const req = new NextRequest("http://acme.example.com/dashboard", {
        headers: { host: "acme.example.com" },
      });

      const res = await proxy(req);
      expect(res.headers.get("x-middleware-rewrite")).toContain("/tenant-suspended");
    });

    it("307 redirects /w/acme/* to unprefixed path on domain host", async () => {
      vi.mocked(resolveModule.resolveTenantByHost).mockResolvedValueOnce({
        kind: "tenant",
        tenantId: "t-1",
        slug: "acme",
        urlMode: "subdomain",
        canonicalBase: "http://acme.example.com",
        status: "ACTIVE",
      });

      const req = new NextRequest("http://acme.example.com/w/acme/settings/billing", {
        headers: { host: "acme.example.com" },
      });

      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://acme.example.com/settings/billing");
    });

    it("redirects unauthenticated user on protected path to /login?next=...", async () => {
      vi.mocked(resolveModule.resolveTenantByHost).mockResolvedValueOnce({
        kind: "tenant",
        tenantId: "t-1",
        slug: "acme",
        urlMode: "subdomain",
        canonicalBase: "http://acme.example.com",
        status: "ACTIVE",
      });

      const req = new NextRequest("http://acme.example.com/dashboard", {
        headers: { host: "acme.example.com" },
      });

      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login?next=%2Fdashboard");
    });

    it("redirects authenticated user on /login to /dashboard", async () => {
      vi.mocked(resolveModule.resolveTenantByHost).mockResolvedValueOnce({
        kind: "tenant",
        tenantId: "t-1",
        slug: "acme",
        urlMode: "subdomain",
        canonicalBase: "http://acme.example.com",
        status: "ACTIVE",
      });

      const req = new NextRequest("http://acme.example.com/login", {
        headers: {
          host: "acme.example.com",
          cookie: `${ACCESS_COOKIE}=valid-token`,
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://acme.example.com/dashboard");
    });
  });

  describe("Platform Host Routing", () => {
    it("gates unauthenticated platform staff access to /platform/login?next=...", async () => {
      const req = new NextRequest("http://example.com/platform/tenants", {
        headers: {
          host: "example.com",
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/platform/login?next=%2Fplatform%2Ftenants");
    });

    it("redirects authenticated platform staff on /platform/login to /platform/dashboard", async () => {
      const req = new NextRequest("http://example.com/platform/login", {
        headers: {
          host: "example.com",
          cookie: `${PLATFORM_STAFF_COOKIE}=staff-jwt`,
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://example.com/platform/dashboard");
    });
  });

  describe("Content Security Policy (CSP)", () => {
    it("includes Razorpay origins in script-src, frame-src, and connect-src", async () => {
      vi.mocked(resolveModule.resolveTenantByHost).mockResolvedValueOnce({
        kind: "tenant",
        tenantId: "t-1",
        slug: "acme",
        urlMode: "subdomain",
        canonicalBase: "http://acme.example.com",
        status: "ACTIVE",
      });

      const req = new NextRequest("http://acme.example.com/dashboard", {
        headers: {
          host: "acme.example.com",
          cookie: `${ACCESS_COOKIE}=valid-token`,
        },
      });

      const res = await proxy(req);
      const csp = res.headers.get("content-security-policy");
      expect(csp).toBeTruthy();
      expect(csp).toContain("https://checkout.razorpay.com");
      expect(csp).toContain("https://api.razorpay.com");
      expect(csp).toContain("https://lumberjack.razorpay.com");
    });
  });
});
