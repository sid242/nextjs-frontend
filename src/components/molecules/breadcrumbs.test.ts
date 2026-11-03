import { describe, expect, it } from "vitest";

import { parseBreadcrumbs } from "./breadcrumbs";

describe("parseBreadcrumbs", () => {
  it("handles empty or root path gracefully", () => {
    expect(parseBreadcrumbs("")).toEqual({
      homeHref: "/dashboard",
      homeLabel: "Dashboard",
      crumbs: [],
    });
    expect(parseBreadcrumbs("/")).toEqual({
      homeHref: "/dashboard",
      homeLabel: "Dashboard",
      crumbs: [],
    });
  });

  describe("Path-based tenant routes (/w/[tenantSlug]/...)", () => {
    it("strips /w and tenantSlug from displayed crumbs and prefixes links with workspace path", () => {
      const result = parseBreadcrumbs("/w/nexus-estate/team");

      expect(result.homeHref).toBe("/w/nexus-estate/dashboard");
      expect(result.homeLabel).toBe("Workspace Dashboard");
      expect(result.crumbs).toEqual([
        {
          href: "/w/nexus-estate/team",
          label: "Team",
          isLast: true,
        },
      ]);
    });

    it("correctly handles nested routes under tenant workspace", () => {
      const result = parseBreadcrumbs("/w/nexus-estate/groups/new");

      expect(result.homeHref).toBe("/w/nexus-estate/dashboard");
      expect(result.crumbs).toEqual([
        {
          href: "/w/nexus-estate/groups",
          label: "User Groups",
          isLast: false,
        },
        {
          href: "/w/nexus-estate/groups/new",
          label: "Create",
          isLast: true,
        },
      ]);
    });

    it("replaces UUID segments with 'Details' and preserves trailing action", () => {
      const result = parseBreadcrumbs(
        "/w/nexus-estate/groups/123e4567-e89b-12d3-a456-426614174000/edit",
      );

      expect(result.homeHref).toBe("/w/nexus-estate/dashboard");
      expect(result.crumbs).toEqual([
        {
          href: "/w/nexus-estate/groups",
          label: "User Groups",
          isLast: false,
        },
        {
          href: "/w/nexus-estate/groups/123e4567-e89b-12d3-a456-426614174000",
          label: "Details",
          isLast: false,
        },
        {
          href: "/w/nexus-estate/groups/123e4567-e89b-12d3-a456-426614174000/edit",
          label: "Edit",
          isLast: true,
        },
      ]);
    });
  });

  describe("Platform portal routes (/platform/...)", () => {
    it("strips /platform from displayed crumbs and links home to /platform/dashboard", () => {
      const result = parseBreadcrumbs("/platform/groups/new");

      expect(result.homeHref).toBe("/platform/dashboard");
      expect(result.homeLabel).toBe("Platform Dashboard");
      expect(result.crumbs).toEqual([
        {
          href: "/platform/groups",
          label: "User Groups",
          isLast: false,
        },
        {
          href: "/platform/groups/new",
          label: "Create",
          isLast: true,
        },
      ]);
    });

    it("handles platform dashboard route", () => {
      const result = parseBreadcrumbs("/platform/dashboard");

      expect(result.homeHref).toBe("/platform/dashboard");
      expect(result.crumbs).toEqual([
        {
          href: "/platform/dashboard",
          label: "Dashboard",
          isLast: true,
        },
      ]);
    });
  });

  describe("Standard root app routes", () => {
    it("processes standard routes without prefix", () => {
      const result = parseBreadcrumbs("/groups/new");

      expect(result.homeHref).toBe("/dashboard");
      expect(result.homeLabel).toBe("Dashboard");
      expect(result.crumbs).toEqual([
        {
          href: "/groups",
          label: "User Groups",
          isLast: false,
        },
        {
          href: "/groups/new",
          label: "Create",
          isLast: true,
        },
      ]);
    });
  });
});
