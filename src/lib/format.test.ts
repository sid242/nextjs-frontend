import { describe, expect, it } from "vitest";
import { formatBytes, initials } from "./format";

describe("formatBytes", () => {
  it("handles empty values", () => {
    expect(formatBytes(null)).toBe("—");
    expect(formatBytes(0)).toBe("0 B");
  });
  it("scales units", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(10 * 1024 * 1024)).toBe("10 MB");
  });
});

describe("initials", () => {
  it("takes up to two letters", () => {
    expect(initials("priya shah")).toBe("PS");
    expect(initials("  Amit  ")).toBe("A");
    expect(initials("a b c")).toBe("AB");
  });
});
