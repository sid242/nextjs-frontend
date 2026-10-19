import "server-only";

import { getEnv } from "./env";

export interface BackendInit extends Omit<RequestInit, "headers"> {
  token?: string | null;
  json?: unknown;
  headers?: Record<string, string | undefined>;
  search?: string;
}

export function backendUrl(path: string, search = ""): string {
  const base = getEnv().API_URL.replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}${search}`;
}

/** Server-to-server call to the backend API. */
export async function backendFetch(path: string, init: BackendInit = {}): Promise<Response> {
  const { token, json, headers = {}, search, ...rest } = init;
  const h = new Headers();
  h.set("accept", "application/json");
  if (json !== undefined) h.set("content-type", "application/json");
  for (const [key, value] of Object.entries(headers)) if (value) h.set(key, value);
  if (token) h.set("authorization", `Bearer ${token}`);

  return fetch(backendUrl(path, search), {
    ...rest,
    headers: h,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: "no-store",
    signal: rest.signal ?? AbortSignal.timeout(15_000),
  });
}
