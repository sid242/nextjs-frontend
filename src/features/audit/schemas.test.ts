import { describe, expect, it } from "vitest";

import { auditLogsFilterSchema, updateTenantAuditPolicySchema } from "./schemas";

describe("Audit Feature Schemas", () => {
  describe("auditLogsFilterSchema", () => {
    it("applies defaults and allows valid filters", () => {
      const parsed = auditLogsFilterSchema.parse({
        page: 2,
        result: "SUCCESS",
        source: "DIRECT",
        search: "login",
      });

      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(50);
      expect(parsed.result).toBe("SUCCESS");
      expect(parsed.source).toBe("DIRECT");
      expect(parsed.search).toBe("login");
    });

    it("rejects invalid result status", () => {
      const result = auditLogsFilterSchema.safeParse({
        result: "UNKNOWN_STATUS",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateTenantAuditPolicySchema", () => {
    it("validates retention days within bounds", () => {
      const valid = updateTenantAuditPolicySchema.parse({
        retentionDays: 90,
        complianceFramework: "SOC2",
      });
      expect(valid.retentionDays).toBe(90);
      expect(valid.complianceFramework).toBe("SOC2");
    });

    it("rejects retention window shorter than 7 days", () => {
      const result = updateTenantAuditPolicySchema.safeParse({
        retentionDays: 3,
        complianceFramework: "SOC2",
      });
      expect(result.success).toBe(false);
    });

    it("rejects retention window exceeding 3650 days", () => {
      const result = updateTenantAuditPolicySchema.safeParse({
        retentionDays: 5000,
        complianceFramework: "SOC2",
      });
      expect(result.success).toBe(false);
    });
  });
});
