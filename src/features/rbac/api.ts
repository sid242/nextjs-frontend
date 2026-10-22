import { api } from "@/lib/api/http";

import type { AppModule, CreateRoleInput, Permission, Role } from "./schemas";

const DEFAULT_PERMISSIONS: Permission[] = [
  { key: "tenants:read", name: "View Workspace", description: "View organization details" },
  { key: "tenants:update", name: "Update Workspace", description: "Modify settings and plan" },
  { key: "members:read", name: "View Members", description: "List workspace members" },
  { key: "members:invite", name: "Invite Members", description: "Send team invitations" },
  { key: "members:delete", name: "Remove Members", description: "Revoke team memberships" },
  { key: "roles:read", name: "View Roles", description: "View workspace role assignments" },
  { key: "roles:create", name: "Create Roles", description: "Create custom roles and scopes" },
  { key: "roles:assign", name: "Assign Roles", description: "Grant roles to team members" },
  { key: "files:read", name: "Read Files", description: "Access and download workspace files" },
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

const DEFAULT_PLATFORM_ROLES: Role[] = [
  {
    id: "platform-support",
    name: "Customer Support Staff",
    description:
      "Investigates tenant inquiries, troubleshoots via audited sessions, reviews audit logs",
    permissions: [
      "tenants::read",
      "tenant_support::start",
      "tenant_support::end",
      "platform_audit::read",
      "system_health::read",
    ],
    isSystem: true,
    usersCount: 1,
  },
  {
    id: "platform-billing",
    name: "Billing & Finance Staff",
    description: "Manages tenant subscriptions, upgrades, and billing configurations",
    permissions: ["tenants::read", "billing::read", "billing::manage", "platform_audit::read"],
    isSystem: true,
    usersCount: 0,
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

export async function getPlatformRoles(signal?: AbortSignal): Promise<Role[]> {
  try {
    const data = await api.get<Role[]>("/platform/roles", { signal });
    if (data?.length) {
      return data.map((r) => ({
        ...r,
        usersCount: r.usersCount ?? r.userCount ?? 0,
      }));
    }
    return DEFAULT_PLATFORM_ROLES;
  } catch {
    return DEFAULT_PLATFORM_ROLES;
  }
}

export async function createPlatformRole(input: CreateRoleInput): Promise<Role> {
  try {
    return await api.post<Role>("/platform/roles", input);
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

export async function updatePlatformRole(
  roleId: string,
  input: Partial<CreateRoleInput>,
): Promise<Role> {
  return await api.patch<Role>(`/platform/roles/${roleId}`, input);
}

export async function deletePlatformRole(roleId: string): Promise<void> {
  await api.delete(`/platform/roles/${roleId}`);
}

export async function getPlatformPermissions(signal?: AbortSignal): Promise<Permission[]> {
  try {
    const data = await api.get<Permission[]>("/platform/permissions", { signal });
    return data?.length ? data : DEFAULT_PERMISSIONS;
  } catch {
    return DEFAULT_PERMISSIONS;
  }
}

const DEFAULT_MODULES: AppModule[] = [
  {
    id: "mod-files",

    key: "files",
    name: "File Storage & Media",
    description: "S3 direct presigned uploads, media asset storage, and download links",
    icon: "folder",
    sortOrder: 10,
    isSystem: true,
    permissions: [
      {
        key: "files:read",
        name: "View & Download Files",
        action: "read",
        description: "Access organization files",
        category: "File Storage & Media",
      },
      {
        key: "files:write",
        name: "Upload & Create Files",
        action: "create",
        description: "Upload new files to S3",
        category: "File Storage & Media",
      },
      {
        key: "files:delete",
        name: "Delete Files",
        action: "delete",
        description: "Delete organization files",
        category: "File Storage & Media",
      },
    ],
  },
  {
    id: "mod-tenants",
    key: "tenants",
    name: "Organization & Workspace",
    description: "Manage company settings, workspace details, and subscription plan",
    icon: "building",
    sortOrder: 20,
    isSystem: true,
    permissions: [
      {
        key: "tenants:read",
        name: "View Organization",
        action: "read",
        description: "View organization details",
        category: "Organization & Workspace",
      },
      {
        key: "tenants:update",
        name: "Update Organization",
        action: "update",
        description: "Modify organization info and plan",
        category: "Organization & Workspace",
      },
      {
        key: "tenants:delete",
        name: "Delete Organization",
        action: "delete",
        description: "Permanently remove organization",
        category: "Organization & Workspace",
      },
    ],
  },
  {
    id: "mod-members",
    key: "members",
    name: "Team & Member Management",
    description: "Invite colleagues, manage team roster, and update membership status",
    icon: "users",
    sortOrder: 25,
    isSystem: true,
    permissions: [
      {
        key: "members:read",
        name: "View Team Members",
        action: "read",
        description: "List workspace members",
        category: "Team & Member Management",
      },
      {
        key: "members:invite",
        name: "Invite Team Members",
        action: "invite",
        description: "Send invitations to new members",
        category: "Team & Member Management",
      },
      {
        key: "members:update",
        name: "Update Member Status",
        action: "update",
        description: "Change membership active/suspended status",
        category: "Team & Member Management",
      },
      {
        key: "members:delete",
        name: "Remove Member",
        action: "delete",
        description: "Remove member from organization",
        category: "Team & Member Management",
      },
    ],
  },
  {
    id: "mod-rbac",
    key: "rbac",
    name: "Access Control & Roles",
    description: "Manage custom roles, role permissions matrix, and member role assignments",
    icon: "shield",
    sortOrder: 30,
    isSystem: true,
    permissions: [
      {
        key: "roles:read",
        name: "View Roles & Permissions",
        action: "read",
        description: "Inspect available roles and permission sets",
        category: "Access Control & Roles",
      },
      {
        key: "roles:create",
        name: "Create Custom Role",
        action: "create",
        description: "Create custom roles",
        category: "Access Control & Roles",
      },
      {
        key: "roles:update",
        name: "Update Role Permissions",
        action: "update",
        description: "Modify permissions for custom roles",
        category: "Access Control & Roles",
      },
      {
        key: "roles:delete",
        name: "Delete Custom Role",
        action: "delete",
        description: "Delete non-system roles",
        category: "Access Control & Roles",
      },
      {
        key: "roles:assign",
        name: "Assign Member Roles",
        action: "assign",
        description: "Assign or reassign roles to members",
        category: "Access Control & Roles",
      },
      {
        key: "modules:read",
        name: "View Modules Catalog",
        action: "read",
        description: "Inspect system and custom modules",
        category: "Access Control & Roles",
      },
      {
        key: "modules:manage",
        name: "Manage System Modules",
        action: "manage",
        description: "Create, update, or remove application modules",
        category: "Access Control & Roles",
      },
      {
        key: "permissions:manage",
        name: "Manage Granular Permissions",
        action: "manage",
        description: "Create, update, or remove granular permissions",
        category: "Access Control & Roles",
      },
    ],
  },
  {
    id: "mod-audit",
    key: "audit",
    name: "Security & Audit Logs",
    description: "Enterprise security activity logs and compliance history",
    icon: "file-text",
    sortOrder: 40,
    isSystem: true,
    permissions: [
      {
        key: "audit:read",
        name: "View Audit Logs",
        action: "read",
        description: "Inspect audit trail and security events",
        category: "Security & Audit Logs",
      },
    ],
  },
];

export async function getPlatformModules(signal?: AbortSignal): Promise<AppModule[]> {
  try {
    const data = await api.get<AppModule[]>("/rbac/modules", { signal });
    return data?.length ? data : DEFAULT_MODULES;
  } catch {
    return DEFAULT_MODULES;
  }
}
