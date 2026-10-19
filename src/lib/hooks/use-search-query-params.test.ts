import { describe, expect, it } from "vitest";

import {
  applyQueryUpdates,
  buildQueryUrl,
  parseQueryBoolean,
  parseQueryNumber,
  toQueryObject,
} from "./use-search-query-params";

describe("useSearchQueryParams utilities", () => {
  describe("parseQueryNumber", () => {
    it("parses valid integer and float numbers", () => {
      expect(parseQueryNumber("42")).toBe(42);
      expect(parseQueryNumber("3.14")).toBe(3.14);
      expect(parseQueryNumber("-10")).toBe(-10);
    });

    it("returns fallback on null, undefined, or empty string", () => {
      expect(parseQueryNumber(null, 1)).toBe(1);
      expect(parseQueryNumber(undefined, 5)).toBe(5);
      expect(parseQueryNumber("", 10)).toBe(10);
      expect(parseQueryNumber(null)).toBeUndefined();
    });

    it("returns fallback on non-numeric strings", () => {
      expect(parseQueryNumber("abc", 1)).toBe(1);
      expect(parseQueryNumber("NaN", 2)).toBe(2);
      expect(parseQueryNumber("Infinity", 3)).toBe(3);
    });
  });

  describe("parseQueryBoolean", () => {
    it("parses truthy boolean flags", () => {
      expect(parseQueryBoolean("true")).toBe(true);
      expect(parseQueryBoolean("TRUE")).toBe(true);
      expect(parseQueryBoolean("1")).toBe(true);
      expect(parseQueryBoolean("yes")).toBe(true);
    });

    it("parses falsy boolean flags", () => {
      expect(parseQueryBoolean("false")).toBe(false);
      expect(parseQueryBoolean("0")).toBe(false);
      expect(parseQueryBoolean("no")).toBe(false);
    });

    it("returns fallback on unrecognised, null, or undefined values", () => {
      expect(parseQueryBoolean(null, true)).toBe(true);
      expect(parseQueryBoolean(undefined, false)).toBe(false);
      expect(parseQueryBoolean("maybe", true)).toBe(true);
      expect(parseQueryBoolean(null)).toBeUndefined();
    });
  });

  describe("toQueryObject", () => {
    it("converts single and multi-value params into a dictionary", () => {
      const params = new URLSearchParams("tab=workspace&page=1&tag=tech&tag=ai");
      const obj = toQueryObject(params);

      expect(obj.tab).toBe("workspace");
      expect(obj.page).toBe("1");
      expect(obj.tag).toEqual(["tech", "ai"]);
    });

    it("handles empty params", () => {
      const params = new URLSearchParams("");
      expect(toQueryObject(params)).toEqual({});
    });
  });

  describe("applyQueryUpdates", () => {
    it("sets, updates, and deletes parameters in-place", () => {
      const params = new URLSearchParams("tab=profile&page=1&filter=active");

      applyQueryUpdates(params, {
        tab: "workspace",
        page: 2,
        filter: null, // delete
        search: "", // delete
        empty: undefined, // delete
      });

      expect(params.get("tab")).toBe("workspace");
      expect(params.get("page")).toBe("2");
      expect(params.has("filter")).toBe(false);
      expect(params.has("search")).toBe(false);
      expect(params.has("empty")).toBe(false);
    });

    it("handles array updates", () => {
      const params = new URLSearchParams("tag=old");

      applyQueryUpdates(params, {
        tag: ["alpha", "beta"],
      });

      expect(params.getAll("tag")).toEqual(["alpha", "beta"]);
    });
  });

  describe("buildQueryUrl", () => {
    it("constructs full query URL from pathname and string query", () => {
      const url = buildQueryUrl("/settings", "tab=profile", { tab: "security" });
      expect(url).toBe("/settings?tab=security");
    });

    it("removes query string completely when all params are deleted", () => {
      const url = buildQueryUrl("/users", "page=1", { page: null });
      expect(url).toBe("/users");
    });

    it("supports complex batch updates and array parameters", () => {
      const url = buildQueryUrl("/search", "q=test&page=1", {
        page: 2,
        sort: "desc",
        q: "nextjs",
        roles: ["admin", "member"],
      });

      expect(url).toBe("/search?q=nextjs&page=2&sort=desc&roles=admin&roles=member");
    });
  });
});
