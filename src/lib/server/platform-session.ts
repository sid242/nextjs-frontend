import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { PLATFORM_ROUTES } from "@/config/routes";
import { PLATFORM_STAFF_COOKIE } from "@/lib/auth/constants";
import { backendFetch } from "@/lib/server/backend";

export const getPlatformStaff = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(PLATFORM_STAFF_COOKIE)?.value;
  if (!token) return null;
  const res = await backendFetch("/platform/auth/me", { token });
  if (res.status === 401 || !res.ok) return null;
  const body = (await res.json().catch(() => null)) as { data?: { staff?: unknown } } | null;
  return body?.data?.staff ?? body?.data ?? body;
});

export async function requirePlatformStaff() {
  const staff = await getPlatformStaff();
  if (!staff) {
    redirect(PLATFORM_ROUTES.LOGIN);
  }
  return staff;
}
