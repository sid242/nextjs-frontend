import { z } from "zod";

import { verificationCodeSchema } from "@/lib/auth/verification-code";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email").max(254),
  password: z.string().min(1, "Password is required").max(128),
});

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email").max(254),
  password: z.string().min(8, "Use at least 8 characters").max(128, "Password is too long"),
});

export const acceptInviteNewUserSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(50),
    lastName: z.string().trim().min(1, "Last name is required").max(50),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AcceptInviteNewUserValues = z.infer<typeof acceptInviteNewUserSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email").max(254),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z.string().min(8, "Use at least 8 characters").max(128, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Use at least 8 characters").max(128, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const requestEmailVerificationSchema = z.object({
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
});

export const userSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  deviceName: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  lastActiveAt: z.string(),
  createdAt: z.string(),
  isCurrent: z.boolean().default(false),
});

export const userLoginEventSchema = z.object({
  id: z.string(),
  userId: z.string().nullable().optional(),
  tenantId: z.string().nullable().optional(),
  result: z.enum(["SUCCESS", "FAILED", "LOCKED", "MFA_FAILED"]),
  method: z.string(),
  ip: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>;
export type RequestEmailVerificationValues = z.infer<typeof requestEmailVerificationSchema>;
export type UserSession = z.infer<typeof userSessionSchema>;
export type UserLoginEvent = z.infer<typeof userLoginEventSchema>;

export const requestMagicLinkSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email").max(254),
});
export type RequestMagicLinkValues = z.infer<typeof requestMagicLinkSchema>;

export const verifyMagicLinkSchema = z.object({
  token: z.string().min(1, "Magic link token is required"),
});
export type VerifyMagicLinkValues = z.infer<typeof verifyMagicLinkSchema>;

// ─── Two-Factor Authentication ──────────────────────────────────────────────────

export const twoFactorCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit authentication code"),
});
export type TwoFactorCodeValues = z.infer<typeof twoFactorCodeSchema>;

export const twoFactorDisableSchema = z.object({
  password: z.string().min(1, "Password is required"),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit authentication code"),
});
export type TwoFactorDisableValues = z.infer<typeof twoFactorDisableSchema>;

export const twoFactorChallengeSchema = z.object({
  challengeToken: z.string().min(1, "Challenge token is required"),
  code: verificationCodeSchema,
});
export type TwoFactorChallengeValues = z.infer<typeof twoFactorChallengeSchema>;

export interface TwoFactorStatus {
  enabled: boolean;
  enabledAt: string | null;
  recoveryCodesRemaining?: number;
}

export interface TwoFactorSetupData {
  secret: string;
  otpauthUri: string;
}

export interface TwoFactorEnableData {
  message: string;
  recoveryCodes: string[];
}

export const regenerateRecoveryCodesSchema = z.object({
  password: z.string().optional(),
  code: z.string().optional(),
});
export type RegenerateRecoveryCodesValues = z.infer<typeof regenerateRecoveryCodesSchema>;

export interface RegenerateRecoveryCodesData {
  message: string;
  recoveryCodes: string[];
}
