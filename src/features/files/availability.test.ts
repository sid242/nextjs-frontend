import { describe, expect, it } from "vitest";

import { isFileAvailable } from "./availability";
import { filesKeys } from "./keys";

describe("file availability", () => {
  it("requires upload confirmation and a clean scan", () => {
    expect(isFileAvailable({ status: "UPLOADED", scanStatus: "CLEAN" })).toBe(true);
    expect(isFileAvailable({ status: "PENDING", scanStatus: "CLEAN" })).toBe(false);
    for (const scanStatus of ["PENDING", "INFECTED", "FAILED", "SKIPPED", undefined] as const) {
      expect(isFileAvailable({ status: "UPLOADED", scanStatus })).toBe(false);
    }
  });

  it("partitions equivalent workspace file queries", () => {
    expect(filesKeys.list("alpha", { search: "report" })).not.toEqual(
      filesKeys.list("beta", { search: "report" }),
    );
  });
});
