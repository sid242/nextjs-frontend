import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, "Must be a valid international phone number (e.g. +919876543210)")
    .or(z.literal(""))
    .nullable()
    .optional(),
});
export type ProfileValues = z.infer<typeof profileSchema>;
