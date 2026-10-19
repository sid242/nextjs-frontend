import { api } from "@/lib/api/http";
import type { User } from "@/lib/api/types";

import type { AdminUser, ProfileValues } from "./schemas";

export const updateMe = (values: ProfileValues) => api.patch<User>("/users/me", values);

export async function listUsers(page = 1, limit = 20, signal?: AbortSignal): Promise<AdminUser[]> {
  try {
    const data = await api.get<AdminUser[]>(`/users?page=${page}&limit=${limit}`, { signal });
    return data ?? [];
  } catch {
    return [
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

export async function impersonateUser(userId: string): Promise<void> {
  await api.post("/auth/impersonate", { userId });
}
