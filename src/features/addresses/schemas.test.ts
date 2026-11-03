import { describe, expect, it } from "vitest";

import { addressSchema } from "./schemas";

describe("addressSchema", () => {
  it("accepts valid Indian address with 6-digit PIN and stateGeoId", () => {
    const valid = addressSchema.safeParse({
      line1: "101, Business Park",
      countryCode: "IN",
      postalCode: "380001",
      stateGeoId: 24,
      districtGeoId: 440,
    });
    expect(valid.success).toBe(true);
  });

  it("validates PIN codes for India correctly", () => {
    // Valid 6-digit
    expect(
      addressSchema.safeParse({
        line1: "101, Business Park",
        countryCode: "IN",
        postalCode: "380001",
        stateGeoId: 24,
      }).success,
    ).toBe(true);

    // Starts with 0 -> invalid
    expect(
      addressSchema.safeParse({
        line1: "101, Business Park",
        countryCode: "IN",
        postalCode: "012345",
        stateGeoId: 24,
      }).success,
    ).toBe(false);

    // 5 digits -> invalid
    expect(
      addressSchema.safeParse({
        line1: "101, Business Park",
        countryCode: "IN",
        postalCode: "38001",
        stateGeoId: 24,
      }).success,
    ).toBe(false);

    // 7 digits -> invalid
    expect(
      addressSchema.safeParse({
        line1: "101, Business Park",
        countryCode: "IN",
        postalCode: "3800011",
        stateGeoId: 24,
      }).success,
    ).toBe(false);
  });

  it("requires stateGeoId for Indian addresses", () => {
    const res = addressSchema.safeParse({
      line1: "101, Business Park",
      countryCode: "IN",
      postalCode: "380001",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path.includes("stateGeoId"))).toBe(true);
    }
  });

  it("allows non-India addresses without stateGeoId using free text", () => {
    const res = addressSchema.safeParse({
      line1: "10 Downing Street",
      countryCode: "GB",
      postalCode: "SW1A 2AA",
      stateName: "Greater London",
      localityName: "Westminster",
    });
    expect(res.success).toBe(true);
  });

  it("rejects non-India addresses when geo IDs are passed", () => {
    const res = addressSchema.safeParse({
      line1: "10 Downing Street",
      countryCode: "GB",
      stateGeoId: 24,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(
        res.error.issues.some((i) => i.message.includes("Location ids are only valid for India")),
      ).toBe(true);
    }
  });

  it("enforces line1 minimum length", () => {
    expect(
      addressSchema.safeParse({
        line1: "ab",
        countryCode: "IN",
        postalCode: "380001",
        stateGeoId: 24,
      }).success,
    ).toBe(false);
  });
});
