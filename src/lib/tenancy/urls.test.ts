import { describe, expect, it } from "vitest";

import { absoluteTenantUrl, tenantHref, type TenantUrlContextValue } from "./urls";

describe("urls utilities", () => {
  describe("tenantHref", () => {
    it("returns /w/{slug}{path} for path mode", () => {
      const ctx: TenantUrlContextValue = {
        slug: "acme",
        mode: "path",
        canonicalBase: "https://example.com/w/acme",
      };

      expect(tenantHref(ctx, "/dashboard")).toBe("/w/acme/dashboard");
      expect(tenantHref(ctx, "dashboard")).toBe("/w/acme/dashboard");
      expect(tenantHref(ctx, "/settings/url")).toBe("/w/acme/settings/url");
    });

    it("returns unprefixed path for subdomain mode", () => {
      const ctx: TenantUrlContextValue = {
        slug: "acme",
        mode: "subdomain",
        canonicalBase: "https://acme.example.com",
      };

      expect(tenantHref(ctx, "/dashboard")).toBe("/dashboard");
      expect(tenantHref(ctx, "/settings")).toBe("/settings");
    });

    it("returns unprefixed path for customDomain mode", () => {
      const ctx: TenantUrlContextValue = {
        slug: "acme",
        mode: "customDomain",
        canonicalBase: "https://portal.acme.com",
      };

      expect(tenantHref(ctx, "/dashboard")).toBe("/dashboard");
      expect(tenantHref(ctx, "/team")).toBe("/team");
    });

    it("handles null or missing context gracefully", () => {
      expect(tenantHref(null, "/dashboard")).toBe("/dashboard");
      expect(tenantHref(undefined, "/dashboard")).toBe("/dashboard");
    });
  });

  describe("absoluteTenantUrl", () => {
    it("builds absolute canonical URL correctly", () => {
      expect(absoluteTenantUrl("https://example.com/w/acme", "/dashboard")).toBe(
        "https://example.com/w/acme/dashboard",
      );
      expect(absoluteTenantUrl("https://acme.example.com/", "/dashboard")).toBe(
        "https://acme.example.com/dashboard",
      );
      expect(absoluteTenantUrl("https://acme.example.com", "dashboard")).toBe(
        "https://acme.example.com/dashboard",
      );
    });
  });
});
