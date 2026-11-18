import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  firstName: z.string().trim().min(1, "First name must be at least 1 character").optional(),
  lastName: z.string().trim().optional(),
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
