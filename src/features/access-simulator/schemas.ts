import { z } from "zod";

export const simulateAccessSchema = z.object({
  userId: z.string().uuid({ message: "Valid user ID is required" }),
  permission: z.string().min(1, { message: "Permission key is required" }),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
});

export type SimulateAccessFormInput = z.infer<typeof simulateAccessSchema>;
