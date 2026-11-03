import { describe, expect, it } from "vitest";

import { profileSchema } from "./schemas";

describe("profileSchema", () => {
  it("validates profile with name and Indian phone number", () => {
    const valid = profileSchema.safeParse({
      name: "Siddharth Prajapati",
      phoneNumber: "+919876543210",
    });
    expect(valid.success).toBe(true);
  });

  it("validates profile without phone number (optional)", () => {
    const withoutPhone = profileSchema.safeParse({
      name: "Siddharth",
    });
    expect(withoutPhone.success).toBe(true);

    const emptyPhone = profileSchema.safeParse({
      name: "Siddharth",
      phoneNumber: "",
    });
    expect(emptyPhone.success).toBe(true);

    const nullPhone = profileSchema.safeParse({
      name: "Siddharth",
      phoneNumber: null,
    });
    expect(nullPhone.success).toBe(true);
  });

  it("validates international phone numbers (+1, +44)", () => {
    const usPhone = profileSchema.safeParse({
      name: "John Doe",
      phoneNumber: "+14155552671",
    });
    expect(usPhone.success).toBe(true);
  });

  it("rejects invalid phone numbers without leading plus or malformed", () => {
    const invalidNoPlus = profileSchema.safeParse({
      name: "John Doe",
      phoneNumber: "9876543210",
    });
    expect(invalidNoPlus.success).toBe(false);

    const invalidLetters = profileSchema.safeParse({
      name: "John Doe",
      phoneNumber: "+91abc",
    });
    expect(invalidLetters.success).toBe(false);
  });

  it("rejects short names", () => {
    const shortName = profileSchema.safeParse({
      name: "A",
      phoneNumber: "+919876543210",
    });
    expect(shortName.success).toBe(false);
  });
});
