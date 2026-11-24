import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_COOKIE, PLATFORM_STAFF_COOKIE } from "@/lib/auth/constants";
import * as backendModule from "@/lib/server/backend";
import { clearResolveCache, resolveTenantBySlug } from "@/lib/tenancy/resolve";

import { GET, HEAD, POST } from "./route";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/server/backend", () => ({
  backendFetch: vi.fn(),
}));

describe("BFF Generic Proxy Route & Security Hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearResolveCache();
  });

  describe("Finding 2: Route-aware credential selection when both cookies are present", () => {
    it("routes /platform/* requests with PLATFORM_STAFF_COOKIE even if ACCESS_COOKIE exists", async () => {
      vi.mocked(backendModule.backendFetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { id: "staff-1" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const req = new NextRequest("http://localhost:3000/api/proxy/platform/tenants", {
        method: "GET",
        headers: {
          cookie: `${ACCESS_COOKIE}=customer-token-123; ${PLATFORM_STAFF_COOKIE}=staff-token-xyz`,
        },
      });

      const res = await GET(req, {
        params: Promise.resolve({ path: ["platform", "tenants"] }),
      });

      expect(res.status).toBe(200);
      expect(backendModule.backendFetch).toHaveBeenCalledTimes(1);
      expect(backendModule.backendFetch).toHaveBeenCalledWith(
        "/platform/tenants",
        expect.objectContaining({
          token: "staff-token-xyz",
        }),
      );
    });

    it("routes tenant/user requests with ACCESS_COOKIE even if PLATFORM_STAFF_COOKIE exists", async () => {
      vi.mocked(backendModule.backendFetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: "file-1" }] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const req = new NextRequest("http://localhost:3000/api/proxy/files", {
        method: "GET",
        headers: {
          cookie: `${ACCESS_COOKIE}=customer-token-123; ${PLATFORM_STAFF_COOKIE}=staff-token-xyz`,
        },
      });

      const res = await GET(req, {
        params: Promise.resolve({ path: ["files"] }),
      });

      expect(res.status).toBe(200);
      expect(backendModule.backendFetch).toHaveBeenCalledTimes(1);
      expect(backendModule.backendFetch).toHaveBeenCalledWith(
        "/files",
        expect.objectContaining({
          token: "customer-token-123",
        }),
      );
    });

    it("rejects with 401 if platform staff cookie is missing on platform endpoint", async () => {
      const req = new NextRequest("http://localhost:3000/api/proxy/platform/audit-logs", {
        method: "GET",
        headers: {
          cookie: `${ACCESS_COOKIE}=customer-token-only`,
        },
      });

      const res = await GET(req, {
        params: Promise.resolve({ path: ["platform", "audit-logs"] }),
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error?.code).toBe("UNAUTHORIZED");
      expect(backendModule.backendFetch).not.toHaveBeenCalled();
    });
  });

  describe("Finding 3: Byte-accurate bounded body size validation", () => {
    it("returns 413 PAYLOAD_TOO_LARGE when Content-Length exceeds 1MB", async () => {
      const req = new NextRequest("http://localhost:3000/api/proxy/tenants/update", {
        method: "POST",
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
          cookie: `${ACCESS_COOKIE}=customer-token-123`,
          "content-length": "1000001",
        },
        body: JSON.stringify({ test: "data" }),
      });

      const res = await POST(req, {
        params: Promise.resolve({ path: ["tenants", "update"] }),
      });

      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error?.code).toBe("PAYLOAD_TOO_LARGE");
      expect(backendModule.backendFetch).not.toHaveBeenCalled();
    });

    it("returns 413 PAYLOAD_TOO_LARGE when raw byte length of multibyte characters exceeds 1MB", async () => {
      // Create a string of multibyte emoji characters where string.length might be small,
      // but UTF-8 byte count exceeds 1,000,000 bytes.
      // 4-byte emoji 🚀 (F0 9F 9A 80) is 2 UTF-16 code units, but 4 bytes in UTF-8
      const emojiCount = 260_000; // 260,000 * 4 bytes = 1,040,000 bytes > 1,000,000
      const largePayload = JSON.stringify({ emoji: "🚀".repeat(emojiCount) });

      const req = new NextRequest("http://localhost:3000/api/proxy/tenants/update", {
        method: "POST",
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
          cookie: `${ACCESS_COOKIE}=customer-token-123`,
          "content-type": "application/json",
        },
        body: largePayload,
      });

      const res = await POST(req, {
        params: Promise.resolve({ path: ["tenants", "update"] }),
      });

      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error?.code).toBe("PAYLOAD_TOO_LARGE");
      expect(backendModule.backendFetch).not.toHaveBeenCalled();
    });
  });

  describe("Finding 4: HEAD method is supported and exported", () => {
    it("exports HEAD and handles HEAD requests without buffering body", async () => {
      expect(typeof HEAD).toBe("function");

      vi.mocked(backendModule.backendFetch).mockResolvedValueOnce(
        new Response(null, {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const req = new NextRequest("http://localhost:3000/api/proxy/files", {
        method: "HEAD",
        headers: {
          cookie: `${ACCESS_COOKIE}=customer-token-123`,
        },
      });

      const res = await HEAD(req, {
        params: Promise.resolve({ path: ["files"] }),
      });

      expect(res.status).toBe(200);
      expect(backendModule.backendFetch).toHaveBeenCalledWith(
        "/files",
        expect.objectContaining({
          method: "HEAD",
          token: "customer-token-123",
        }),
      );
    });
  });

  describe("Finding 1: Platform authentication token exposure prevention", () => {
    it("delegates /platform/auth/login to platform login handler, setting httpOnly cookie and removing raw token from JSON", async () => {
      vi.mocked(backendModule.backendFetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              token: "raw-super-secret-jwt-token",
              staff: { id: "s1", email: "admin@saas.com", displayName: "Admin" },
            },
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
              "set-cookie": "platform_staff_token=raw-super-secret-jwt-token; Path=/; HttpOnly",
            },
          },
        ),
      );

      const req = new NextRequest("http://localhost:3000/api/proxy/platform/auth/login", {
        method: "POST",
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
          "content-type": "application/json",
        },
        body: JSON.stringify({ email: "admin@saas.com", password: "Password@123" }),
      });

      const res = await POST(req, {
        params: Promise.resolve({ path: ["platform", "auth", "login"] }),
      });

      expect(res.status).toBe(200);

      // Verify raw token is NOT in JSON response
      const json = await res.json();
      expect(json.token).toBeUndefined();
      expect(json.staff).toEqual({ id: "s1", email: "admin@saas.com", displayName: "Admin" });

      // Verify cookie was attached to response
      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toBeTruthy();
      expect(setCookie).toContain("platform_staff_token=");
    });
  });

  describe("Tenant Header Isolation & Client Spoofing Prevention", () => {
    it("ties the file event stream lifetime to the browser request", async () => {
      const upstream = vi.mocked(backendModule.backendFetch);
      upstream.mockResolvedValueOnce(
        new Response(":connected\n\n", {
          headers: { "content-type": "text/event-stream", "x-accel-buffering": "no" },
        }),
      );
      const request = new NextRequest("http://localhost:3000/api/proxy/files/events/stream", {
        headers: { cookie: `${ACCESS_COOKIE}=customer-token` },
      });
      const response = await GET(request, {
        params: Promise.resolve({ path: ["files", "events", "stream"] }),
      });

      expect(upstream.mock.lastCall?.[1]?.signal).toBe(request.signal);
      expect(response.headers.get("x-accel-buffering")).toBe("no");
    });

    it("forwards the workspace slug even when a page cached an earlier ID", async () => {
      const resolve = (tenantId: string) =>
        Response.json({ data: { tenantId, slug: "example-workspace", status: "ACTIVE" } });
      const upstream = vi.mocked(backendModule.backendFetch);
      upstream.mockResolvedValueOnce(resolve("previous-tenant"));
      await resolveTenantBySlug("example-workspace");
      upstream.mockResolvedValueOnce(Response.json({ data: [] }));

      const request = new NextRequest("http://localhost:3000/api/proxy/files", {
        headers: {
          host: "localhost:3000",
          referer: "http://localhost:3000/w/example-workspace/files",
          cookie: `${ACCESS_COOKIE}=customer-token`,
        },
      });
      const response = await GET(request, { params: Promise.resolve({ path: ["files"] }) });

      expect(response.status).toBe(200);
      expect(upstream.mock.lastCall?.[1]?.headers?.["x-tenant-id"]).toBe("example-workspace");
      expect(upstream.mock.calls).toHaveLength(2);
    });

    it("overwrites a client-supplied tenant ID with the workspace slug from the same-origin path", async () => {
      vi.mocked(backendModule.backendFetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { success: true } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      // Client sends forged x-tenant-id: evil-tenant-999 on platform host with referer to /w/legit-acme
      const req = new NextRequest("http://localhost:3000/api/proxy/files", {
        method: "GET",
        headers: {
          host: "localhost:3000",
          referer: "http://localhost:3000/w/legit-acme/files",
          cookie: `${ACCESS_COOKIE}=valid-customer-token`,
          "x-tenant-id": "evil-tenant-999",
        },
      });

      const res = await GET(req, {
        params: Promise.resolve({ path: ["files"] }),
      });

      expect(res.status).toBe(200);

      // Verified that evil-tenant-999 is NOT passed through to backend, and real tenant ID is passed
      const proxyCall = vi
        .mocked(backendModule.backendFetch)
        .mock.calls.find((call) => call[0] === "/files");
      expect(proxyCall).toBeDefined();
      expect(proxyCall?.[1]?.headers?.["x-tenant-id"]).toBe("legit-acme");
    });

    it("omits x-tenant-id header entirely when tenant context is unresolved", async () => {
      vi.mocked(backendModule.backendFetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      // Request on platform host without any referer
      const req = new NextRequest("http://localhost:3000/api/proxy/users/me", {
        method: "GET",
        headers: {
          host: "localhost:3000",
          cookie: `${ACCESS_COOKIE}=valid-customer-token`,
        },
      });

      const res = await GET(req, {
        params: Promise.resolve({ path: ["users", "me"] }),
      });

      expect(res.status).toBe(200);
      const calledOptions = vi.mocked(backendModule.backendFetch).mock.calls[0]?.[1];
      expect(calledOptions?.headers?.["x-tenant-id"]).toBeUndefined();
    });
  });
});
