/**
 * Role options for inviting new workspace members with full descriptive labels.
 */
export const ROLE_OPTIONS = [
  { value: "MEMBER", label: "Member (Standard Access)" },
  { value: "ADMIN", label: "Administrator (Manage Workspace)" },
  { value: "OWNER", label: "Owner (Full Permissions)" },
  { value: "VIEWER", label: "Viewer (Read Only Access)" },
] as const;

/**
 * Compact role options for member table dropdowns and inline role selectors.
 */
export const MEMBER_ROLE_OPTIONS = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "MEMBER", label: "Member" },
  { value: "VIEWER", label: "Viewer" },
] as const;

export type TenantRole = (typeof MEMBER_ROLE_OPTIONS)[number]["value"];
