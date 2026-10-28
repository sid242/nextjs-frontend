import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
});
export type ProfileValues = z.infer<typeof profileSchema>;
