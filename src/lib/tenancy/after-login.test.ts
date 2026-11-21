import { beforeEach, describe, expect, it } from "vitest";

import { routeAfterLogin, type UserMembershipSummary } from "./after-login";

describe("routeAfterLogin", () => {
  const cleanHost = "example.com";

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_BASE_DOMAIN = "example.com";
  });

  const memberAcme: UserMembershipSummary = {
    tenantId: "t-1",
    slug: "acme",
    name: "Acme Corp",
    canonicalBase: "https://example.com/w/acme",
    status: "ACTIVE",
  };

  const memberSubdomain: UserMembershipSummary = {
    tenantId: "t-2",
    slug: "globex",
    name: "Globex",
    canonicalBase: "https://globex.example.com",
    status: "ACTIVE",
  };

  const memberCustom: UserMembershipSummary = {
    tenantId: "t-3",
    slug: "initech",
    name: "Initech",
    canonicalBase: "https://initech.com",
    status: "ACTIVE",
  };

  it("routes to /select-workspace when user has 0 memberships", () => {
    const result = routeAfterLogin([], cleanHost);
    expect(result).toEqual({ type: "navigate", path: "/select-workspace" });
  });

  it("routes to /select-workspace when memberships is null/undefined", () => {
    const result = routeAfterLogin(undefined, cleanHost);
    expect(result).toEqual({ type: "navigate", path: "/select-workspace" });
  });

  it("routes single membership on same platform host to /w/{slug}/dashboard", () => {
    const result = routeAfterLogin([memberAcme], cleanHost);
    expect(result).toEqual({ type: "navigate", path: "/w/acme/dashboard" });
  });

  it("routes single membership with valid next path matching tenant slug", () => {
    const result = routeAfterLogin([memberAcme], cleanHost, "/w/acme/settings/billing");
    expect(result).toEqual({ type: "navigate", path: "/w/acme/settings/billing" });
  });

  it("ignores next path if it points to another tenant slug", () => {
    const result = routeAfterLogin([memberAcme], cleanHost, "/w/other-tenant/settings");
    expect(result).toEqual({ type: "navigate", path: "/w/acme/dashboard" });
  });

  it("triggers handoff for single membership on subdomain host", () => {
    const result = routeAfterLogin([memberSubdomain], cleanHost);
    expect(result).toEqual({
      type: "handoff",
      tenantId: "t-2",
      targetHost: "globex.example.com",
      next: "/dashboard",
    });
  });

  it("triggers handoff for single membership on custom domain host", () => {
    const result = routeAfterLogin([memberCustom], cleanHost);
    expect(result).toEqual({
      type: "handoff",
      tenantId: "t-3",
      targetHost: "initech.com",
      next: "/dashboard",
    });
  });

  it("routes to /select-workspace when user has multiple active memberships without matching next", () => {
    const result = routeAfterLogin([memberAcme, memberSubdomain], cleanHost);
    expect(result).toEqual({ type: "navigate", path: "/select-workspace" });
  });

  it("resolves destination directly when next matches one of the user's tenant memberships", () => {
    const result = routeAfterLogin([memberAcme, memberSubdomain], cleanHost, "/w/acme/files");
    expect(result).toEqual({
      type: "navigate",
      path: "/w/acme/files",
    });
  });

  it("opens the workspace named by the sign-in page for users with multiple memberships", () => {
    const result = routeAfterLogin([memberAcme, memberSubdomain], cleanHost, null, "acme");
    expect(result).toEqual({ type: "navigate", path: "/w/acme/dashboard" });
  });

  it("does not mistake a tenant slug prefix for the current workspace", () => {
    const result = routeAfterLogin([memberAcme], cleanHost, "/w/acme-east/files");
    expect(result).toEqual({ type: "navigate", path: "/w/acme/dashboard" });
  });

  it("preserves the requested tenant page on domain handoff", () => {
    const result = routeAfterLogin([memberSubdomain], cleanHost, "/w/globex/files?sort=name");
    expect(result).toEqual({
      type: "handoff",
      tenantId: "t-2",
      targetHost: "globex.example.com",
      next: "/files?sort=name",
    });
  });
});
