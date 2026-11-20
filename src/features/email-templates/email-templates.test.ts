import { describe, expect, it } from "vitest";

import { CATEGORY_FILTER_OPTIONS, STATUS_COLORS, STATUS_FILTER_OPTIONS } from "./constants";
import { emailTemplatesKeys } from "./keys";

describe("Email Templates Feature Invariants", () => {
  it("builds correct hierarchical query keys", () => {
    expect(emailTemplatesKeys.all).toEqual(["email-templates"]);
    expect(emailTemplatesKeys.list({ page: 1 })).toEqual(["email-templates", "list", { page: 1 }]);
    expect(emailTemplatesKeys.detail("tpl-123")).toEqual(["email-templates", "detail", "tpl-123"]);
    expect(emailTemplatesKeys.versions("tpl-123")).toEqual([
      "email-templates",
      "versions",
      "tpl-123",
    ]);
    expect(emailTemplatesKeys.deliveryLogs({ to: "test@example.com" })).toEqual([
      "email-templates",
      "delivery-logs",
      { to: "test@example.com" },
    ]);
    expect(emailTemplatesKeys.suppressions({ reason: "BOUNCE" })).toEqual([
      "email-templates",
      "suppressions",
      { reason: "BOUNCE" },
    ]);
  });

  it("exports complete category and status options", () => {
    expect(CATEGORY_FILTER_OPTIONS.length).toBeGreaterThanOrEqual(4);
    expect(STATUS_FILTER_OPTIONS.length).toBeGreaterThanOrEqual(3);
    expect(STATUS_COLORS.PUBLISHED).toBeDefined();
    expect(STATUS_COLORS.DRAFT).toBeDefined();
    expect(STATUS_COLORS.ARCHIVED).toBeDefined();
  });
});
