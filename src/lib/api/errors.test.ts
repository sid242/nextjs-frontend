import { describe, expect, it } from "vitest";
import { ApiError, getErrorMessage, isApiError, isCanceledError, toApiError } from "./errors";

const axiosError = (
  response?: {
    status: number;
    data?: unknown;
    headers?: Record<string, string>;
    statusText?: string;
  },
  code?: string,
) => ({
  isAxiosError: true,
  code,
  response,
});

describe("toApiError", () => {
  it("maps the backend error envelope, request id and retry-after", () => {
    const err = toApiError(
      axiosError({
        status: 429,
        data: {
          error: { code: "RATE_LIMITED", message: "Slow down", details: { x: 1 } },
          requestId: "req-1",
        },
        headers: { "retry-after": "30" },
      }),
    );
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      status: 429,
      code: "RATE_LIMITED",
      message: "Slow down",
      requestId: "req-1",
      retryAfter: 30,
    });
  });

  it("falls back to the x-request-id header and status text for non-JSON bodies", () => {
    const err = toApiError(
      axiosError({
        status: 502,
        data: "<html>bad gateway</html>",
        statusText: "Bad Gateway",
        headers: { "x-request-id": "abc" },
      }),
    );
    expect(err).toMatchObject({
      status: 502,
      code: "HTTP_ERROR",
      message: "Bad Gateway",
      requestId: "abc",
    });
  });

  it("treats a missing response as a network error or timeout (status 0)", () => {
    expect(toApiError(axiosError(undefined, "ERR_NETWORK"))).toMatchObject({
      status: 0,
      code: "NETWORK_ERROR",
    });
    expect(toApiError(axiosError(undefined, "ECONNABORTED"))).toMatchObject({
      status: 0,
      code: "TIMEOUT",
    });
  });

  it("passes cancellations and unknown errors through untouched", () => {
    const canceled = { isAxiosError: true, code: "ERR_CANCELED", name: "CanceledError" };
    expect(toApiError(canceled)).toBe(canceled);
    const other = new TypeError("boom");
    expect(toApiError(other)).toBe(other);
  });

  it("is idempotent", () => {
    const once = toApiError(
      axiosError({ status: 400, data: { error: { code: "X", message: "m" } } }),
    );
    expect(toApiError(once)).toBe(once);
  });
});

describe("helpers", () => {
  it("isCanceledError / isApiError", () => {
    expect(isCanceledError({ code: "ERR_CANCELED" })).toBe(true);
    expect(isCanceledError(new DOMException("x", "AbortError"))).toBe(true);
    expect(isCanceledError(new Error("x"))).toBe(false);
    expect(isApiError(new ApiError(404, "NOT_FOUND", "x"), 404)).toBe(true);
    expect(isApiError(new ApiError(404, "NOT_FOUND", "x"), 500)).toBe(false);
  });
});

describe("getErrorMessage", () => {
  it("hides server internals but keeps a support reference", () => {
    expect(getErrorMessage(new ApiError(500, "X", "stack trace", undefined, "abcdef123456"))).toBe(
      "Something went wrong. Please try again. (ref abcdef12)",
    );
    expect(getErrorMessage(new ApiError(500, "X", "stack trace"))).toBe(
      "Something went wrong. Please try again.",
    );
  });
  it("explains rate limits, offline and client errors", () => {
    expect(getErrorMessage(new ApiError(429, "R", "x", undefined, undefined, 12))).toMatch(/12s/);
    expect(getErrorMessage(new ApiError(429, "R", "x"))).toMatch(/Too many/);
    expect(getErrorMessage(new ApiError(0, "NETWORK_ERROR", "Offline"))).toBe("Offline");
    expect(getErrorMessage(new ApiError(400, "BAD", "Invalid email"))).toBe("Invalid email");
    expect(getErrorMessage("weird")).toBe("Something went wrong. Please try again.");
  });
});
