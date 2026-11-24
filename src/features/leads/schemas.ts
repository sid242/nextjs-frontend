import { z } from "zod";

export const leadStatusSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
]);

export const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email required"),
  phone: z.string().max(30).optional(),
  company: z.string().max(100).optional(),
  status: leadStatusSchema,
  value: z.coerce.number().int().min(0),
  departmentId: z.string().max(50).optional(),
  regionId: z.string().max(50).optional(),
  assignedMemberId: z.string().uuid().optional().or(z.literal("")),
  isConfidential: z.boolean(),
  notes: z.string().max(2000).optional(),
});

export type CreateLeadFormValues = z.infer<typeof createLeadSchema>;
