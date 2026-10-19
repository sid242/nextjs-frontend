import { describe, expect, it } from "vitest";

import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "./schemas";

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
  it("validates forgotPassword and resetPassword schemas", () => {
    expect(forgotPasswordSchema.safeParse({ email: "test@example.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "invalid" }).success).toBe(false);

    expect(
      resetPasswordSchema.safeParse({
        token: "xyz",
        newPassword: "password123",
        confirmPassword: "password123",
      }).success,
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({
        token: "xyz",
        newPassword: "password123",
        confirmPassword: "mismatch",
      }).success,
    ).toBe(false);
  });
});
