import { describe, expect, it } from "vitest";

import { cn, generateSlug, slugify } from "./utils";

describe("cn", () => {
  it("merges tailwind classes cleanly", () => {
    expect(cn("px-2 py-1", "bg-red-500")).toBe("px-2 py-1 bg-red-500");
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("generateSlug", () => {
  it("formats strings into URL-safe slugs correctly", () => {
    expect(generateSlug("Acme Corporation")).toBe("acme-corporation");
    expect(generateSlug("Docs / API Guides")).toBe("docs-api-guides");
    expect(generateSlug("---Hello   World---")).toBe("hello-world");
    expect(generateSlug("Special @#$ Characters!")).toBe("special-characters");
    expect(generateSlug("Nested / Category - Subcategory")).toBe("nested-category-subcategory");
    expect(generateSlug("")).toBe("");
    expect(generateSlug(null as unknown as string)).toBe("");
    expect(generateSlug(undefined as unknown as string)).toBe("");
    expect(slugify("Slugify Alias")).toBe("slugify-alias");
  });
});
