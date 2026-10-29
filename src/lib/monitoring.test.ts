import { describe, expect, it } from "vitest";

import { reportError } from "./monitoring";

describe("reportError monitoring helper", () => {
  it("does not throw when reporting standard errors without Sentry config", () => {
    expect(() => {
      reportError(new Error("Test UI Error"), { component: "UserProfile", action: "save" });
    }).not.toThrow();
  });

  it("handles non-Error objects safely", () => {
    expect(() => {
      reportError("Unexpected string rejection", { route: "/dashboard" });
      reportError(null);
      reportError(undefined);
    }).not.toThrow();
  });
});
