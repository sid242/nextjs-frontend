import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as backendModule from "@/lib/server/backend";

import { GET } from "./route";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/server/backend", () => ({
  backendFetch: vi.fn(),
}));

describe("Handoff Route (/api/auth/handoff)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login?error=handoff_failed when code is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/handoff", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(303);
    const location = res.headers.get("location");
    expect(location).toContain("/login?error=handoff_failed");
    expect(backendModule.backendFetch).not.toHaveBeenCalled();
  });

  it("redirects to /login?error=handoff_failed when backend returns 400 (wrong host or invalid code)", async () => {
    vi.mocked(backendModule.backendFetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: "INVALID_HANDOFF_CODE" } }), {
        status: 400,
      }),
    );

    const req = new NextRequest("http://acme.example.com/api/auth/handoff?code=bad-code", {
      method: "GET",
      headers: { host: "acme.example.com" },
    });

    const res = await GET(req);
    expect(res.status).toBe(303);
    const location = res.headers.get("location");
    expect(location).toContain("/login?error=handoff_failed");
  });

  it("safely redeems valid handoff code, sets cookies, and prevents open-redirect via next parameter", async () => {
    vi.mocked(backendModule.backendFetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            accessToken: "valid-access-jwt",
            refreshToken: "valid-refresh-jwt",
            tenantId: "t-1",
            memberships: [{ tenantId: "t-1", slug: "acme" }],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    // Provide malicious open-redirect next parameter
    const req = new NextRequest(
      "http://acme.example.com/api/auth/handoff?code=good-code&next=https://evil.com/phishing",
      {
        method: "GET",
        headers: { host: "acme.example.com" },
      },
    );

    const res = await GET(req);
    expect(res.status).toBe(303);
    const location = res.headers.get("location");
    // Open redirect is defused to safe fallback (/dashboard)
    expect(location).toBe("http://acme.example.com/dashboard");

    // Cookies are set
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("access_token=");
    expect(setCookie).toContain("refresh_token=");
  });

  it("respects safe relative next parameter on successful handoff", async () => {
    vi.mocked(backendModule.backendFetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            accessToken: "valid-access-jwt",
            refreshToken: "valid-refresh-jwt",
            tenantId: "t-1",
            memberships: [{ tenantId: "t-1", slug: "acme" }],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const req = new NextRequest(
      "http://acme.example.com/api/auth/handoff?code=good-code&next=/settings/billing",
      {
        method: "GET",
        headers: { host: "acme.example.com" },
      },
    );

    const res = await GET(req);
    expect(res.status).toBe(303);
    const location = res.headers.get("location");
    expect(location).toBe("http://acme.example.com/settings/billing");
  });
});
