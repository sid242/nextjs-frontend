import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_COOKIE, PLATFORM_STAFF_COOKIE } from "@/lib/auth/constants";
import * as backendModule from "@/lib/server/backend";

import { GET, HEAD, POST } from "./route";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/server/backend", () => ({
  backendFetch: vi.fn(),
}));

describe("BFF Generic Proxy Route & Security Hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
