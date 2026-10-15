import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { backendFetch } from "@/lib/server/backend";
import type { User } from "@/lib/api/types";
import { ACCESS_COOKIE } from "./constants";

export const getAccessToken = cache(
  async () => (await cookies()).get(ACCESS_COOKIE)?.value ?? null,
);

/** Current user for this request (deduped across layouts/pages). null => not signed in / token rejected. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = await getAccessToken();
  if (!token) return null;
  const res = await backendFetch("/users/me", { token });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Could not load session (${res.status})`);
  return (await res.json()) as User;
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
