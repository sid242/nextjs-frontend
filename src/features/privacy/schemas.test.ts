import { describe, expect, it } from "vitest";

import { requestAccountDeletionSchema, requestTenantClosureSchema } from "./schemas";

describe("Privacy Schemas", () => {
  describe("requestAccountDeletionSchema", () => {
    it("validates empty input", () => {
      const res = requestAccountDeletionSchema.safeParse({});
      expect(res.success).toBe(true);
    });

    it("accepts valid password and reason", () => {
      const res = requestAccountDeletionSchema.safeParse({
        password: "MySecretPassword123!",
        reason: "Moving to a different platform",
      });
      expect(res.success).toBe(true);
    });

    it("rejects overlong reason", () => {
      const res = requestAccountDeletionSchema.safeParse({
        reason: "a".repeat(501),
      });
      expect(res.success).toBe(false);
    });
  });

  describe("requestTenantClosureSchema", () => {
    it("requires slugConfirmation", () => {
      const res = requestTenantClosureSchema.safeParse({
        slugConfirmation: "",
      });
      expect(res.success).toBe(false);
    });

    it("accepts valid slugConfirmation and reason", () => {
      const res = requestTenantClosureSchema.safeParse({
        slugConfirmation: "acme-corp",
        reason: "Company merger",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.slugConfirmation).toBe("acme-corp");
      }
    });
  });
});
