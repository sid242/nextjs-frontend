import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  twoFactorChallengeSchema,
  twoFactorCodeSchema,
  twoFactorDisableSchema,
} from "./schemas";

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

  it("validates two-factor schemas correctly", () => {
    // twoFactorCodeSchema
    expect(twoFactorCodeSchema.safeParse({ code: "123456" }).success).toBe(true);
    expect(twoFactorCodeSchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(twoFactorCodeSchema.safeParse({ code: "1234567" }).success).toBe(false);
    expect(twoFactorCodeSchema.safeParse({ code: "abcdef" }).success).toBe(false);

    // twoFactorDisableSchema
    expect(
      twoFactorDisableSchema.safeParse({
        password: "SecretPassword123",
        code: "654321",
      }).success,
    ).toBe(true);
    expect(
      twoFactorDisableSchema.safeParse({
        password: "",
        code: "654321",
      }).success,
    ).toBe(false);
    expect(
      twoFactorDisableSchema.safeParse({
        password: "SecretPassword123",
        code: "bad",
      }).success,
    ).toBe(false);

    // twoFactorChallengeSchema
    expect(
      twoFactorChallengeSchema.safeParse({
        challengeToken: "challenge-token-abc",
        code: "123456",
      }).success,
    ).toBe(true);
    expect(
      twoFactorChallengeSchema.safeParse({
        challengeToken: "challenge-token-abc",
        code: "RECOVERY01",
      }).success,
    ).toBe(true);
    expect(
      twoFactorChallengeSchema.safeParse({
        challengeToken: "",
        code: "123456",
      }).success,
    ).toBe(false);
  });
});
