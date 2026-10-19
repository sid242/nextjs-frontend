import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import type { User } from "@/lib/api/types";
import { backendFetch } from "@/lib/server/backend";

import { ACCESS_COOKIE, IMPERSONATOR_BACKUP_COOKIE } from "./constants";

export const getAccessToken = cache(
  async () => (await cookies()).get(ACCESS_COOKIE)?.value ?? null,
);

export const isImpersonating = cache(async () => (await cookies()).has(IMPERSONATOR_BACKUP_COOKIE));

/** Current user for this request (deduped across layouts/pages). null => not signed in / token rejected. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = await getAccessToken();
  if (!token) return null;
  const res = await backendFetch("/users/me", { token });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Could not load session (${res.status})`);
  const body = (await res.json()) as { data?: User } | User;
  return ("data" in body && body.data ? body.data : body) as User;
});

/**
 * For server components in protected areas. If the access token is missing/expired the visitor is sent
 * through the refresh route, which re-issues cookies and returns them here (or to /login).
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const path = (await headers()).get("x-pathname") ?? "/dashboard";
    redirect(`/api/auth/refresh?next=${encodeURIComponent(path)}`);
  }
  return user;
}
