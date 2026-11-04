import { z } from "zod";

export const auditLogsFilterSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
  actorUserId: z.string().uuid().optional(),
  effectiveUserId: z.string().uuid().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  result: z.enum(["SUCCESS", "FAILURE", "DENIED"]).optional(),
  source: z.enum(["DIRECT", "GROUP", "IMPERSONATION", "SYSTEM", "JOB"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  requestId: z.string().optional(),
  correlationId: z.string().optional(),
  search: z.string().optional(),
});

export type AuditLogsFilterInput = z.infer<typeof auditLogsFilterSchema>;

export const updateTenantAuditPolicySchema = z.object({
  retentionDays: z
    .number()
    .int()
    .min(7, "Minimum retention window is 7 days")
    .max(3650, "Maximum retention window is 3650 days"),
  exportAllowed: z.boolean().optional(),
  complianceFramework: z
    .string()
    .min(2, "Compliance framework name must be at least 2 characters")
    .max(50),
});

export type UpdateTenantAuditPolicyInput = z.infer<typeof updateTenantAuditPolicySchema>;
