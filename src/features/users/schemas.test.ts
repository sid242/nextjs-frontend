import { describe, expect, it } from "vitest";

import { profileSchema } from "./schemas";

describe("profileSchema", () => {
  it("validates profile with firstName, lastName, and Indian phone number", () => {
    const valid = profileSchema.safeParse({
      firstName: "Siddharth",
      lastName: "Prajapati",
      phoneNumber: "+919876543210",
    });
    expect(valid.success).toBe(true);
  });

  it("validates profile without phone number (optional)", () => {
    const withoutPhone = profileSchema.safeParse({
      firstName: "Siddharth",
      lastName: "Prajapati",
    });
    expect(withoutPhone.success).toBe(true);

    const emptyPhone = profileSchema.safeParse({
      firstName: "Siddharth",
      lastName: "Prajapati",
      phoneNumber: "",
    });
    expect(emptyPhone.success).toBe(true);

    const nullPhone = profileSchema.safeParse({
      firstName: "Siddharth",
      lastName: "Prajapati",
      phoneNumber: null,
    });
    expect(nullPhone.success).toBe(true);
  });

  it("validates international phone numbers (+1, +44)", () => {
    const usPhone = profileSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      phoneNumber: "+14155552671",
    });
    expect(usPhone.success).toBe(true);
  });

  it("rejects invalid phone numbers without leading plus or malformed", () => {
    const invalidNoPlus = profileSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      phoneNumber: "9876543210",
    });
    expect(invalidNoPlus.success).toBe(false);

    const invalidLetters = profileSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      phoneNumber: "+91abc",
    });
    expect(invalidLetters.success).toBe(false);
  });

  it("rejects empty firstName or lastName", () => {
    const missingFirst = profileSchema.safeParse({
      firstName: "",
      lastName: "Doe",
      phoneNumber: "+919876543210",
    });
    expect(missingFirst.success).toBe(false);

    const missingLast = profileSchema.safeParse({
      firstName: "John",
      lastName: "",
      phoneNumber: "+919876543210",
    });
    expect(missingLast.success).toBe(false);
  });
});
