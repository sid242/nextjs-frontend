import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { ApiError, isCanceledError } from "./errors";
import { api, http } from "./http";

type Reply = { status: number; data?: unknown; headers?: Record<string, string> };

/** An adapter that answers from a script instead of the network, and records every call. */
function scripted(
  handler: (
    config: InternalAxiosRequestConfig,
    call: number,
  ) => Reply | Promise<Reply> | "network-error",
) {
  const calls: string[] = [];
  const adapter: AxiosAdapter = async (config) => {
    calls.push(`${config.method?.toUpperCase()} ${config.url}`);
    const out = await handler(config, calls.length);
    if (out === "network-error") throw new AxiosError("Network Error", "ERR_NETWORK", config);
    const response = {
      data: out.data ?? "",
      status: out.status,
      statusText: "",
      headers: out.headers ?? {},
      config,
      request: {},
    };
    if (out.status >= 200 && out.status < 300) return response;
    throw new AxiosError(`HTTP ${out.status}`, "ERR_BAD_REQUEST", config, {}, response);
  };
  return { adapter, calls };
}

const failure = async (promise: Promise<unknown>): Promise<unknown> => {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  throw new Error("expected the request to fail");
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("http (authenticated BFF client)", () => {
  it("returns response data and tags every request with a unique x-request-id", async () => {
    const ids: unknown[] = [];
    http.defaults.adapter = scripted((config) => {
      ids.push(config.headers.get("x-request-id")); // what actually goes on the wire
      return { status: 200, data: [{ id: "f1" }] };
    }).adapter;

    await expect(api.get("/files")).resolves.toEqual([{ id: "f1" }]);
    await api.get("/files");
    expect(typeof ids[0]).toBe("string");
    expect(ids[0] === ids[1]).toBe(false);
  });

  it("on 401: refreshes ONCE for concurrent requests, then retries each request once", async () => {
    let refreshes = 0;
    axios.defaults.adapter = scripted(async () => {
      refreshes++;
      await sleep(20);
      return { status: 204 };
    }).adapter;

    const seen = new Map<string, number>();
    const backend = scripted((config) => {
      const key = String(config.url);
      const n = (seen.get(key) ?? 0) + 1;
      seen.set(key, n);
      return n === 1
        ? { status: 401, data: { error: { code: "UNAUTHORIZED", message: "expired" } } }
        : { status: 200, data: { ok: key } };
    });
    http.defaults.adapter = backend.adapter;

    const results = await Promise.all([api.get("/a"), api.get("/b"), api.get("/c")]);
    expect(results).toEqual([{ ok: "/a" }, { ok: "/b" }, { ok: "/c" }]);
    expect(refreshes).toBe(1); // single-flight
    expect(backend.calls.length).toBe(6); // 3 originals + 3 retries
  });

  it("does not loop: a 401 after a successful refresh is surfaced as ApiError(401)", async () => {
    let refreshes = 0;
    axios.defaults.adapter = scripted(() => {
      refreshes++;
      return { status: 204 };
    }).adapter;
    const backend = scripted(() => ({
      status: 401,
      data: { error: { code: "UNAUTHORIZED", message: "nope" } },
    }));
    http.defaults.adapter = backend.adapter;

    const err = await failure(api.get("/secret"));
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 401, code: "UNAUTHORIZED" });
    expect(refreshes).toBe(1);
    expect(backend.calls.length).toBe(2); // original + exactly one retry
  });

  it("when the session is really over (refresh 401) it fails with ApiError(401) without retrying", async () => {
    axios.defaults.adapter = scripted(() => ({ status: 401 })).adapter;
    const backend = scripted(() => ({
      status: 401,
      data: { error: { code: "UNAUTHORIZED", message: "expired" } },
    }));
    http.defaults.adapter = backend.adapter;

    const err = await failure(api.get("/x"));
    expect(err).toMatchObject({ status: 401 });
    expect(backend.calls.length).toBe(1);
  });

  it("when the refresh endpoint is down (503) it does not retry and still reports the original 401", async () => {
    axios.defaults.adapter = scripted(() => ({ status: 503 })).adapter;
    const backend = scripted(() => ({
      status: 401,
      data: { error: { code: "UNAUTHORIZED", message: "expired" } },
    }));
    http.defaults.adapter = backend.adapter;

    expect(await failure(api.get("/x"))).toMatchObject({ status: 401 });
    expect(backend.calls.length).toBe(1);
  });

  it("normalises server errors and network failures", async () => {
    http.defaults.adapter = scripted(() => ({
      status: 503,
      data: { error: { code: "UPSTREAM_UNAVAILABLE", message: "down" }, requestId: "r-9" },
      headers: { "retry-after": "7" },
    })).adapter;
    expect(await failure(api.get("/x"))).toMatchObject({
      status: 503,
      code: "UPSTREAM_UNAVAILABLE",
      requestId: "r-9",
      retryAfter: 7,
    });

    http.defaults.adapter = scripted(() => "network-error").adapter;
    expect(await failure(api.get("/x"))).toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });

  it("rejects with a cancellation (not an ApiError) when the request is aborted", async () => {
    http.defaults.adapter = scripted(() => ({ status: 200, data: {} })).adapter;
    const controller = new AbortController();
    controller.abort();
    const err = await failure(api.get("/x", { signal: controller.signal }));
    expect(isCanceledError(err)).toBe(true);
    expect(err instanceof ApiError).toBe(false);
  });

  it("returns undefined for 204 responses", async () => {
    http.defaults.adapter = scripted(() => ({ status: 204 })).adapter;
    await expect(api.delete("/files/1")).resolves.toBeUndefined();
  });
});
