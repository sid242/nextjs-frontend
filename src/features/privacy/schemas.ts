import { z } from "zod";

export const requestAccountDeletionSchema = z.object({
  password: z.string().optional(),
  reason: z.string().max(500, "Reason must not exceed 500 characters").optional(),
});

export type RequestAccountDeletionInput = z.infer<typeof requestAccountDeletionSchema>;

export const requestTenantClosureSchema = z.object({
  slugConfirmation: z.string().min(1, "Please type the exact workspace slug to confirm"),
  reason: z.string().max(500, "Reason must not exceed 500 characters").optional(),
});

export type RequestTenantClosureInput = z.infer<typeof requestTenantClosureSchema>;
