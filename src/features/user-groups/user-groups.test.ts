import { describe, expect, it } from "vitest";

import { groupKeys } from "./keys";
import { addMembersSchema, createGroupSchema, updateGroupSchema } from "./schemas";

describe("User Groups Feature - Schemas & Key Factory", () => {
  it("createGroupSchema validates correct group creation payload", () => {
    const valid = createGroupSchema.safeParse({
      name: "Engineering Core",
      slug: "eng-core",
      description: "Platform core infrastructure team",
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.name).toBe("Engineering Core");
      expect(valid.data.slug).toBe("eng-core");
    }
  });

  it("createGroupSchema rejects empty name and malformed slug", () => {
    const emptyName = createGroupSchema.safeParse({
      name: "   ",
      slug: "valid-slug",
    });
    expect(emptyName.success).toBe(false);

    const invalidSlug = createGroupSchema.safeParse({
      name: "Valid Group",
      slug: "INVALID_UPPERCASE_AND_UNDERSCORE",
    });
    expect(invalidSlug.success).toBe(false);
  });

  it("updateGroupSchema allows partial updates", () => {
    const partial = updateGroupSchema.safeParse({
      name: "Updated Name",
      status: "ARCHIVED",
    });
    expect(partial.success).toBe(true);
  });

  it("addMembersSchema validates UUID arrays and requires at least one member", () => {
    const empty = addMembersSchema.safeParse({
      memberIds: [],
    });
    expect(empty.success).toBe(false);

    const invalidUuid = addMembersSchema.safeParse({
      memberIds: ["not-a-uuid"],
    });
    expect(invalidUuid.success).toBe(false);

    const valid = addMembersSchema.safeParse({
      memberIds: ["11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222"],
    });
    expect(valid.success).toBe(true);
  });

  it("groupKeys factory correctly isolates tenant and platform query keys", () => {
    const tenant1Key = groupKeys.tenantList("tenant-123", { status: "ACTIVE" });
    const tenant2Key = groupKeys.tenantList("tenant-456", { status: "ACTIVE" });
    const platformKey = groupKeys.platformList({ status: "ACTIVE" });

    expect(tenant1Key).toEqual(["tenant", "tenant-123", "groups", "list", { status: "ACTIVE" }]);
    expect(tenant2Key).toEqual(["tenant", "tenant-456", "groups", "list", { status: "ACTIVE" }]);
    expect(platformKey).toEqual(["platform", "groups", "list", { status: "ACTIVE" }]);

    // Cross-scope isolation check
    expect(tenant1Key[0]).toBe("tenant");
    expect(tenant1Key[1]).toBe("tenant-123");
    expect(platformKey[0]).toBe("platform");
    expect(tenant1Key[1]).not.toEqual(tenant2Key[1]);
  });
});
