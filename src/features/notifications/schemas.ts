import { z } from "zod";

export const notificationTypeSchema = z.enum(["info", "success", "warning", "error"]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  message: z.string(),
  type: notificationTypeSchema.default("info"),
  read: z.boolean().default(false),
  createdAt: z.string(),
  link: z.string().nullable().optional(),
});
export type NotificationItem = z.infer<typeof notificationItemSchema>;
