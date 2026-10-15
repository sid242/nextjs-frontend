import { z } from "zod";

// Mirrors backend validation (email <= 254, password 8..128, name 1..100).
export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email").max(254),
  password: z.string().min(1, "Password is required").max(128),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email").max(254),
  password: z.string().min(8, "Use at least 8 characters").max(128, "Password is too long"),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
