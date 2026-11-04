import { describe, expect, it } from "vitest";

import { simulateAccessSchema } from "./schemas";

describe("Access Simulator Schemas", () => {
  describe("simulateAccessSchema", () => {
    it("accepts valid simulation payload", () => {
      const valid = simulateAccessSchema.parse({
        userId: "550e8400-e29b-41d4-a716-446655440000",
        permission: "files:read",
        resourceType: "File",
        resourceId: "file_123",
      });

      expect(valid.userId).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(valid.permission).toBe("files:read");
      expect(valid.resourceType).toBe("File");
      expect(valid.resourceId).toBe("file_123");
    });

    it("rejects non-uuid user ID", () => {
      const result = simulateAccessSchema.safeParse({
        userId: "invalid-uuid",
        permission: "files:read",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty permission key", () => {
      const result = simulateAccessSchema.safeParse({
        userId: "550e8400-e29b-41d4-a716-446655440000",
        permission: "",
      });
      expect(result.success).toBe(false);
    });
  });
});
