import { z } from "zod";

export const policyEffectSchema = z.enum(["allow", "deny"]);

export const createPolicySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
  resource: z.string().min(1, "Resource is required"),
  action: z.string().min(1, "Action is required"),
  effect: policyEffectSchema,
  conditionsJson: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, "Conditions must be valid JSON"),
  priority: z.number().int(),
  isActive: z.boolean(),
});

export type CreatePolicyFormValues = z.infer<typeof createPolicySchema>;
