import { z } from "zod";

export const connectAccountSchema = z.object({
  wabaId: z.string().min(1, "WABA ID is required"),
  displayName: z.string().min(1, "Business Display Name is required"),
  accessToken: z.string().min(1, "Access Token is required"),
  code: z.string().optional(),
});

export type ConnectAccountFormValues = z.infer<typeof connectAccountSchema>;

export const templateButtonSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["QUICK_REPLY", "URL", "PHONE_NUMBER"]),
  text: z.string().min(1, "Button text is required").max(25),
  value: z.string().optional(),
});

export type TemplateButtonFormValues = z.infer<typeof templateButtonSchema>;

export const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(512)
    .regex(/^[a-z0-9_]+$/, "Name must be lowercase alphanumeric with underscores only"),
  category: z.enum(["AUTHENTICATION", "UTILITY", "MARKETING"]),
  language: z.string().min(2),
  headerType: z.enum(["NONE", "TEXT", "IMAGE", "DOCUMENT", "VIDEO"]),
  headerText: z.string().optional(),
  bodyText: z.string().min(1, "Body text is required"),
  footerText: z.string().optional(),
  buttons: z.array(templateButtonSchema).optional(),
});

export type CreateTemplateFormValues = z.infer<typeof createTemplateSchema>;

export const sendTemplateMessageSchema = z.object({
  phoneNumberId: z.string().optional(),
  to: z.string().min(7, "Recipient phone number is required (E.164)"),
  templateName: z.string().min(1, "Template is required"),
  language: z.string().default("en"),
  param1: z.string().optional(),
  param2: z.string().optional(),
  param3: z.string().optional(),
});

export type SendTemplateMessageFormValues = z.infer<typeof sendTemplateMessageSchema>;

export const sendTextMessageSchema = z.object({
  phoneNumberId: z.string().optional(),
  to: z.string().min(7, "Recipient phone number is required (E.164)"),
  text: z.string().min(1, "Message text is required").max(4096),
});

export type SendTextMessageFormValues = z.infer<typeof sendTextMessageSchema>;

export function splitCampaignRecipients(value: string) {
  return [
    ...new Set(
      value
        .split(/[\n,]+/)
        .map((number) => number.trim())
        .filter(Boolean),
    ),
  ];
}

export const createCampaignSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required").max(255),
  templateId: z.string().min(1, "Template selection is required"),
  phoneNumberId: z.string().optional(),
  recipients: z.string().refine((value) => {
    const recipients = splitCampaignRecipients(value);
    return recipients.length > 0 && recipients.every((number) => /^\+[1-9]\d{6,14}$/.test(number));
  }, "Enter international phone numbers with a country code, separated by commas or new lines"),
});

export type CreateCampaignFormValues = z.infer<typeof createCampaignSchema>;

export const scheduleCampaignFormSchema = z.object({
  scheduledAt: z
    .string()
    .refine(
      (value) => value === "" || Date.parse(value) > Date.now(),
      "Choose a future time to schedule the campaign",
    ),
});

export const replyConversationSchema = z.object({
  text: z.string().min(1, "Reply message cannot be empty").max(4096),
});

export type ReplyConversationFormValues = z.infer<typeof replyConversationSchema>;
