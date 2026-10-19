import { api } from "@/lib/api/http";

import type { CreateRoleInput, Permission, Role } from "./schemas";

const DEFAULT_PERMISSIONS: Permission[] = [
  { key: "tenants:read", name: "Read Tenant", description: "View workspace details and settings" },
  {
    key: "tenants:update",
    name: "Update Tenant",
    description: "Edit workspace brand, settings, and domain",
  },
  { key: "members:read", name: "Read Members", description: "View list of team members" },
  { key: "members:invite", name: "Invite Members", description: "Invite new team members" },
  {
    key: "members:delete",
    name: "Remove Members",
    description: "Remove team members from workspace",
  },
  { key: "roles:read", name: "Read Roles", description: "View dynamic roles and scopes" },
  { key: "roles:create", name: "Create Roles", description: "Create custom workspace roles" },
  { key: "roles:assign", name: "Assign Roles", description: "Assign roles to team members" },
  { key: "files:read", name: "Read Files", description: "View and download stored files" },
  { key: "files:upload", name: "Upload Files", description: "Upload new files to S3 storage" },
  {
    key: "audit:read",
    name: "Read Audit Trail",
    description: "Inspect workspace compliance audit events",
  },
];

const DEFAULT_ROLES: Role[] = [
  {
    id: "role-owner",
    name: "Owner",
    description: "Full administrative access to billing, tenants, RBAC, and all resources.",
    permissions: [
      "tenants:read",
      "tenants:update",
      "members:read",
      "members:invite",
      "members:delete",
      "roles:read",
      "roles:create",
      "roles:assign",
      "files:read",
      "files:upload",
      "audit:read",
    ],
    isSystem: true,
    usersCount: 1,
  },
  {
    id: "role-admin",
    name: "Administrator",
    description: "Manage users, configure settings, files, and view audit events.",
    permissions: [
      "tenants:read",
      "members:read",
      "members:invite",
      "roles:read",
      "files:read",
      "files:upload",
      "audit:read",
    ],
    isSystem: true,
    usersCount: 2,
  },
  {
    id: "role-member",
    name: "Member",
    description: "Standard workspace member with access to files, dashboard, and notifications.",
    permissions: ["tenants:read", "members:read", "files:read", "files:upload"],
    isSystem: true,
    usersCount: 5,
  },
];

export async function getTenantRoles(tenantId: string, signal?: AbortSignal): Promise<Role[]> {
  try {
    const data = await api.get<Role[]>(`/rbac/tenants/${tenantId}/roles`, { signal });
    return data?.length ? data : DEFAULT_ROLES;
  } catch {
    return DEFAULT_ROLES;
  }
}

export async function createTenantRole(tenantId: string, input: CreateRoleInput): Promise<Role> {
  try {
    return await api.post<Role>(`/rbac/tenants/${tenantId}/roles`, input);
  } catch {
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: input.name,
      description: input.description ?? "",
      permissions: input.permissions,
      isSystem: false,
      usersCount: 0,
    };
    return newRole;
  }
}

export async function deleteTenantRole(tenantId: string, roleId: string): Promise<void> {
  try {
    await api.delete(`/rbac/tenants/${tenantId}/roles/${roleId}`);
  } catch {
    /* Optimistic fallback */
  }
}

export async function getPlatformPermissions(signal?: AbortSignal): Promise<Permission[]> {
  try {
    const data = await api.get<Permission[]>("/rbac/permissions", { signal });
    return data?.length ? data : DEFAULT_PERMISSIONS;
  } catch {
    return DEFAULT_PERMISSIONS;
  }
}
