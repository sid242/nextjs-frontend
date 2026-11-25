import { describe, expect, it } from "vitest";

import { formatBytes, formatMinorCurrency, initials } from "./format";

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

describe("formatMinorCurrency", () => {
  it("formats ISO currencies with the matching symbol", () => {
    expect(formatMinorCurrency(299900, "INR")).toBe("₹2,999");
    expect(formatMinorCurrency(4900, "USD")).toBe("$49");
    expect(formatMinorCurrency(4900, "EUR")).toBe("€49");
    expect(formatMinorCurrency(4900, "GBP")).toBe("£49");
    expect(formatMinorCurrency(4900, "CAD")).toBe("CA$49");
  });

  it("preserves fractional cents and handles zero with the currency symbol", () => {
    expect(formatMinorCurrency(0, "INR")).toBe("₹0");
    expect(formatMinorCurrency(0, "EUR")).toBe("€0");
    expect(formatMinorCurrency(4950, "usd")).toBe("$49.50");
    expect(formatMinorCurrency(1999, " eur ")).toBe("€19.99");
  });

  it("supports explicit fraction digits and invalid currency fallback", () => {
    expect(
      formatMinorCurrency(4900, "USD", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ).toBe("$49.00");
    expect(formatMinorCurrency(4900, "INVALID")).toBe("INVALID 49");
  });
});

describe("initials", () => {
  it("takes up to two letters", () => {
    expect(initials("priya shah")).toBe("PS");
    expect(initials("  Amit  ")).toBe("A");
    expect(initials("a b c")).toBe("AB");
  });
});
