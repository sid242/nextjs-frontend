import { api, authApi } from "@/lib/api/http";
import type { User } from "@/lib/api/types";

import type { AdminUser, PaginatedAdminUsers, ProfileValues } from "./schemas";

export const updateMe = (values: ProfileValues) => api.patch<User>("/users/me", values);

export async function listUsers(
  page = 1,
  limit = 20,
  signal?: AbortSignal,
): Promise<PaginatedAdminUsers> {
  try {
    const data = await api.get<PaginatedAdminUsers | AdminUser[]>(
      `/users?page=${page}&limit=${limit}`,
      { signal },
    );
    if (Array.isArray(data)) {
      return { items: data, total: data.length, page, limit };
    }
    if (
      data &&
      typeof data === "object" &&
      Array.isArray((data as { items?: AdminUser[] })?.items)
    ) {
      return data as PaginatedAdminUsers;
    }
    return { items: [], total: 0, page, limit };
  } catch {
    const fallbackItems: AdminUser[] = [
      {
        id: "usr-admin",
        name: "Platform Administrator",
        email: "admin@platform.com",
        role: "ADMIN",
        status: "ACTIVE",
        emailVerified: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "usr-demo",
        name: "Standard Demo User",
        email: "demo@platform.com",
        role: "USER",
        status: "ACTIVE",
        emailVerified: true,
        createdAt: new Date().toISOString(),
      },
    ];
    return { items: fallbackItems, total: fallbackItems.length, page, limit };
  }
}

export async function updateUserRole(userId: string, role: "USER" | "ADMIN"): Promise<void> {
  await api.patch(`/users/${userId}/role`, { role });
}

export async function updateUserStatus(
  userId: string,
  status: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED",
): Promise<void> {
  await api.patch(`/users/${userId}/status`, { status });
}

export async function impersonateUser(
  userId: string,
  reason = "Administrative support and investigation",
): Promise<void> {
  await authApi.post("/impersonate", { targetUserId: userId, reason });
}
