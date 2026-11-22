import { z } from "zod";

export const verificationCodeSchema = z
  .string()
  .trim()
  .regex(/^(?:\d{6}|[a-z0-9]{10})$/i, "Enter a 6-digit code or a 10-character recovery code.");
