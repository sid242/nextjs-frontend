import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";

import { shouldRetry } from "./retry";

const err = (status: number) => new ApiError(status, "X", "x");

describe("shouldRetry", () => {
  it("never retries client errors", () => {
    for (const status of [400, 401, 403, 404, 409, 422])
      expect(shouldRetry(0, err(status))).toBe(false);
  });
  it("retries transient failures up to the limit", () => {
    for (const status of [0, 408, 429, 500, 503]) {
      expect(shouldRetry(0, err(status))).toBe(true);
      expect(shouldRetry(1, err(status))).toBe(true);
      expect(shouldRetry(2, err(status))).toBe(false);
    }
  });
  it("retries unknown errors but never cancellations", () => {
    expect(shouldRetry(0, new Error("boom"))).toBe(true);
    expect(shouldRetry(0, { code: "ERR_CANCELED" })).toBe(false);
  });
});
