import { z } from "zod";

export const notificationTypeSchema = z.enum(["info", "success", "warning", "error"]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationCategorySchema = z.enum([
  "SECURITY",
  "ACCOUNT",
  "BILLING",
  "TEAM",
  "FILES",
  "SYSTEM",
  "PRODUCT",
]);
export type NotificationCategory = z.infer<typeof notificationCategorySchema>;

export const notificationSeveritySchema = z.enum(["INFO", "SUCCESS", "WARNING", "CRITICAL"]);
export type NotificationSeverity = z.infer<typeof notificationSeveritySchema>;

export const notificationItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  message: z.string(),
  body: z.string().optional(),
  type: notificationTypeSchema.default("info"),
  category: notificationCategorySchema.default("SYSTEM"),
  severity: notificationSeveritySchema.default("INFO"),
  read: z.boolean().default(false),
  readAt: z.string().nullable().optional(),
  createdAt: z.string(),
  link: z.string().nullable().optional(),
});
export type NotificationItem = z.infer<typeof notificationItemSchema>;

export const notificationPreferencesSchema = z.object({
  category: notificationCategorySchema,
  channelInApp: z.boolean().default(true),
  channelEmail: z.boolean().default(true),
  channelPush: z.boolean().default(false),
  digest: z.enum(["NONE", "DAILY", "WEEKLY"]).default("NONE"),
  quietHoursStart: z.string().nullable().optional(),
  quietHoursEnd: z.string().nullable().optional(),
  timezone: z.string().default("UTC"),
});
export type NotificationPreference = z.infer<typeof notificationPreferencesSchema>;

export const pushDeviceSchema = z.object({
  id: z.string(),
  channel: z.enum(["webpush", "fcm", "apns"]),
  platform: z.string(),
  appVersion: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  failureCount: z.number().default(0),
  disabledAt: z.string().nullable().optional(),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable().optional(),
});
export type PushDevice = z.infer<typeof pushDeviceSchema>;

export interface PushPublicKeyConfig {
  enabled: boolean;
  publicKey: string | null;
}
