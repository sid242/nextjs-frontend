import { z } from "zod";

export const API_KEY_SCOPES = [
  { value: "members:read", label: "Read Members", description: "List workspace team members" },
  { value: "files:read", label: "Read Files", description: "List and download workspace files" },
  { value: "files:write", label: "Write Files", description: "Upload and delete workspace files" },
  {
    value: "tenants:read",
    label: "Read Workspace",
    description: "View workspace profile and settings",
  },
] as const;

export const WEBHOOK_EVENTS = [
  {
    value: "*",
    label: "All Events (Wildcard)",
    description: "Receive every event in the workspace",
  },
  {
    value: "user.created",
    label: "User Created",
    description: "When a new user account is created",
  },
  {
    value: "user.updated",
    label: "User Updated",
    description: "When profile details are modified",
  },
  { value: "member.invited", label: "Member Invited", description: "When an invitation is issued" },
  { value: "member.joined", label: "Member Joined", description: "When an invite is accepted" },
  {
    value: "member.removed",
    label: "Member Removed",
    description: "When a member leaves or is removed",
  },
  {
    value: "file.uploaded",
    label: "File Uploaded",
    description: "When a file upload is confirmed",
  },
  { value: "file.deleted", label: "File Deleted", description: "When a file is deleted" },
  {
    value: "billing.subscription.created",
    label: "Subscription Created",
    description: "New subscription activation",
  },
  {
    value: "billing.subscription.updated",
    label: "Subscription Updated",
    description: "Tier change or status transition",
  },
  {
    value: "billing.invoice.paid",
    label: "Invoice Paid",
    description: "Payment settled successfully",
  },
] as const;

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1, "Key name is required").max(100, "Maximum 100 characters"),
  scopes: z.array(z.string()).min(1, "Select at least one scope"),
  rateLimitPerMin: z.coerce
    .number()
    .int()
    .min(10, "Minimum 10 req/min")
    .max(1000, "Maximum 1000 req/min"),
  allowedIps: z.string().trim().optional(),
  expiresInDays: z.coerce.number().int().min(0).max(730),
});

export type CreateApiKeyValues = z.infer<typeof createApiKeySchema>;

export const createWebhookEndpointSchema = z.object({
  url: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .refine(
      (val) =>
        val.startsWith("https://") ||
        val.startsWith("http://localhost") ||
        val.startsWith("http://127.0.0.1"),
      "Must use HTTPS (HTTP permitted only for localhost development)",
    ),
  description: z.string().trim().max(255).optional(),
  events: z.array(z.string()).min(1, "Select at least one subscribed event"),
});

export type CreateWebhookEndpointValues = z.infer<typeof createWebhookEndpointSchema>;

export const updateWebhookEndpointSchema = z.object({
  url: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .refine(
      (val) =>
        val.startsWith("https://") ||
        val.startsWith("http://localhost") ||
        val.startsWith("http://127.0.0.1"),
      "Must use HTTPS (HTTP permitted only for localhost development)",
    )
    .optional(),
  description: z.string().trim().max(255).optional(),
  events: z.array(z.string()).min(1, "Select at least one subscribed event").optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export type UpdateWebhookEndpointValues = z.infer<typeof updateWebhookEndpointSchema>;
