import { describe, expect, it } from "vitest";

import { buildQueryParams, buildQueryString } from "./query";

describe("buildQueryParams & buildQueryString", () => {
  it("returns empty string for null or undefined input", () => {
    expect(buildQueryParams(null)).toBe("");
    expect(buildQueryParams(undefined)).toBe("");
    expect(buildQueryString(null)).toBe("");
    expect(buildQueryString(undefined)).toBe("");
  });

  it("filters out undefined, null, empty strings, and NaN", () => {
    const input = {
      name: "Acme",
      empty: "",
      spaced: "   ",
      missing: undefined,
      nil: null,
      notANum: Number.NaN,
      page: 1,
    };
    expect(buildQueryParams(input)).toBe("name=Acme&page=1");
    expect(buildQueryString(input)).toBe("?name=Acme&page=1");
  });

  it("excludes 0 by default unless specified in includeZeroFields", () => {
    const input = {
      minPrice: 0,
      maxPrice: 100,
      offset: 0,
    };
    expect(buildQueryParams(input)).toBe("maxPrice=100");
    expect(buildQueryParams(input, ["minPrice"])).toBe("minPrice=0&maxPrice=100");
    expect(buildQueryParams(input, { includeZeroFields: ["minPrice", "offset"] })).toBe(
      "minPrice=0&maxPrice=100&offset=0",
    );
  });

  it("excludes sentinel values like 'all' and 'ALL' by default", () => {
    const input = {
      status: "all",
      interval: "ALL",
      role: "admin",
    };
    expect(buildQueryParams(input)).toBe("role=admin");
  });

  it("supports booleans correctly", () => {
    const input = {
      includeInactive: true,
      isSystem: false,
    };
    expect(buildQueryParams(input)).toBe("includeInactive=true&isSystem=false");
  });

  it("formats arrays as repeated keys by default", () => {
    const input = {
      tag: ["engineering", "security"],
    };
    expect(buildQueryParams(input)).toBe("tag=engineering&tag=security");
  });

  it("formats arrays as comma-separated when arrayFormat is 'comma'", () => {
    const input = {
      tag: ["engineering", "security"],
    };
    expect(buildQueryParams(input, { arrayFormat: "comma" })).toBe("tag=engineering%2Csecurity");
  });

  it("trims whitespace from string values", () => {
    const input = {
      search: "  enterprise query  ",
    };
    expect(buildQueryParams(input)).toBe("search=enterprise+query");
  });

  it("returns properly prefixed query string with buildQueryString", () => {
    expect(buildQueryString({ search: "acme" })).toBe("?search=acme");
    expect(buildQueryString({})).toBe("");
  });
});
