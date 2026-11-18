import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name must be at least 1 character"),
  lastName: z.string().trim().min(1, "Last name must be at least 1 character"),
  locale: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, "Must be a valid international phone number (e.g. +919876543210)")
    .or(z.literal(""))
    .nullable()
    .optional(),
});
export type ProfileValues = z.infer<typeof profileSchema>;
