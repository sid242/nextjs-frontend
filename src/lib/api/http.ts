import "client-only"; // build error if a server component imports this: server code uses backendFetch instead

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios";

import { createId } from "@/lib/id";
import { tenantStorage } from "@/lib/storage";

import { toApiError } from "./errors";
import { refreshSession } from "./refresh";

/*
 * Two browser-side axios instances. Both are same-origin: the browser never talks to the backend directly.
 *
 *   http      -> /api/proxy/*   authenticated data calls (cookie -> Bearer happens in the Next.js BFF)
 *                               401 => refresh once (single-flight) => retry once => else /login
 *   authHttp  -> /api/auth/*    login / register / logout / socket-token (no refresh logic)
 *
 * Server components and route handlers do NOT use these; they use backendFetch (lib/server/backend.ts).
 */

const RETRY_HEADER = "x-auth-retry";

function createInstance(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 20_000,
    withCredentials: true,
    headers: { Accept: "application/json" },
  });

  // End-to-end tracing: the BFF forwards this id to the backend, so one id spans browser -> Next -> API logs.
  instance.interceptors.request.use((config) => {
    if (!config.headers.has("x-request-id")) config.headers.set("x-request-id", createId());
    const tenantId = tenantStorage.get();
    if (tenantId && !config.headers.has("x-tenant-id")) {
      config.headers.set("x-tenant-id", tenantId);
    }
    return config;
  });
  return instance;
}

let redirecting = false;
function redirectToLogin() {
  if (typeof window === "undefined" || redirecting) return;
  if (window.location.pathname === "/login") return;
  redirecting = true;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Full page navigation needed outside React lifecycle to clear application state
  window.location.assign(`/login?next=${next}`);
}

export const http = createInstance("/api/proxy");

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const config = axios.isAxiosError(error) ? error.config : undefined;

    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      config &&
      !config.headers.has(RETRY_HEADER)
    ) {
      const outcome = await refreshSession();
      if (outcome === "ok") {
        config.headers.set(RETRY_HEADER, "1"); // retry at most once: a second 401 is a real 401
        return http.request(config); // a failure here is normalised by this same interceptor
      }
      if (outcome === "expired") redirectToLogin();
    }
    throw toApiError(error);
  },
);

export const authHttp = createInstance("/api/auth");
authHttp.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    throw toApiError(error);
  },
);

function createApi(instance: AxiosInstance) {
  const unwrap = <T>(res: AxiosResponse<T>): T => {
    if (res.status === 204) return undefined as T;
    const body = res.data as { success?: boolean; data?: T; message?: string } | T;
    if (body && typeof body === "object" && "success" in body && "data" in body) {
      const data = (body as { data: T }).data;
      const envelopeMessage = (body as { message?: string }).message;
      if (Array.isArray(data)) {
        return data as T;
      }
      if (data && typeof data === "object") {
        if (
          !("message" in (data as Record<string, unknown>)) &&
          typeof envelopeMessage === "string"
        ) {
          return { ...(data as Record<string, unknown>), message: envelopeMessage } as T;
        }
        return data;
      }
      if ((data === null || data === undefined) && typeof envelopeMessage === "string") {
        return { message: envelopeMessage } as unknown as T;
      }
      return data;
    }
    return body as T;
  };
  return {
    get: <T>(url: string, config?: AxiosRequestConfig) => instance.get<T>(url, config).then(unwrap),
    post: <T = void>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      instance.post<T>(url, data, config).then(unwrap),
    put: <T = void>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      instance.put<T>(url, data, config).then(unwrap),
    patch: <T = void>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      instance.patch<T>(url, data, config).then(unwrap),
    delete: <T = void>(url: string, config?: AxiosRequestConfig) =>
      instance.delete<T>(url, config).then(unwrap),
  };
}

/** Typed helpers returning response data: `api.get<FileRecord[]>("/files", { signal })`. */
export const api = createApi(http);
/** Same helpers for our own auth endpoints: `authApi.post("/login", values)`. */
export const authApi = createApi(authHttp);
