import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./schemas";

describe("auth schemas", () => {
  it("accepts valid credentials and trims email", () => {
    expect(loginSchema.parse({ email: "  a@b.co ", password: "x" }).email).toBe("a@b.co");
  });
  it("rejects short passwords on register but not on login", () => {
    expect(
      registerSchema.safeParse({ name: "A", email: "a@b.co", password: "short" }).success,
    ).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(true);
  });
  it("rejects bad emails", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });
});
