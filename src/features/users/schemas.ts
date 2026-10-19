import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const adminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["USER", "ADMIN"]),
  status: z.enum(["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "DEACTIVATED"]),
  emailVerified: z.boolean().default(false),
  createdAt: z.string(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;
