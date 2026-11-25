/**
 * Centralized Application Routes Dictionary.
 *
 * Provides type-safe route paths for Auth, Platform, and Tenant scopes.
 * Using these constants prevents typo regressions and simplifies path refactoring.
 */

export const AUTH_ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  MAGIC_LINK: "/magic-link",
  VERIFY_EMAIL: "/verify-email",
  ACCEPT_INVITE: "/accept-invite",
  SELECT_WORKSPACE: "/select-workspace",
  TENANT_SUSPENDED: "/tenant-suspended",
  PRICING: "/pricing",
} as const;

export const PLATFORM_ROUTES = {
  ROOT: "/platform",
  LOGIN: "/platform/login",
  DASHBOARD: "/platform/dashboard",
  TENANTS: "/platform/tenants",
  TENANT_NEW: "/platform/tenants/new",
  TENANT_DETAIL: (id: string) => `/platform/tenants/${id}` as const,
  DATABASE_OPERATIONS: "/platform/database-operations",
  PLANS: "/platform/plans",
  PLAN_NEW: "/platform/plans/new",
  PLAN_EDIT: (id: string) => `/platform/plans/${id}/edit` as const,
  ROLES: "/platform/roles",
  ROLE_NEW: "/platform/roles/new",
  ROLE_EDIT: (id: string) => `/platform/roles/${id}/edit` as const,
  STAFF: "/platform/staff",
  STAFF_NEW: "/platform/staff/new",
  POLICIES: "/platform/policies",
  POLICY_NEW: "/platform/policies/new",
  POLICY_EDIT: (policyId: string) => `/platform/policies/${policyId}/edit` as const,
  GROUPS: "/platform/groups",
  GROUP_NEW: "/platform/groups/new",
  GROUP_DETAIL: (id: string) => `/platform/groups/${id}` as const,
  GROUP_EDIT: (id: string) => `/platform/groups/${id}/edit` as const,
  USERS: "/platform/users",
  AUDIT_LOGS: "/platform/audit-logs",
  SUPPORT_SESSIONS: "/platform/support-sessions",
  CHAT: "/platform/chat",
} as const;

/**
 * Relative paths for tenant navigation.
 * These are resolved via useTenantHref(path) or tenantHref(ctx, path)
 * to automatically prepend `/w/{slug}` on path mode or remain unprefixed on subdomain mode.
 */
export const TENANT_PATHS = {
  DASHBOARD: "/dashboard",
  LEADS: "/leads",
  LEAD_NEW: "/leads/new",
  LEAD_EDIT: (id: string) => `/leads/${id}/edit` as const,
  FILES: "/files",
  CHAT: "/chat",
  ROLES: "/roles",
  GROUPS: "/groups",
  GROUP_NEW: "/groups/new",
  GROUP_DETAIL: (id: string) => `/groups/${id}` as const,
  GROUP_EDIT: (id: string) => `/groups/${id}/edit` as const,
  TEAM: "/team",
  BILLING: "/billing",
  BRANDING: "/branding",
  AUDIT_LOGS: "/audit-logs",
  POLICIES: "/policies",
  POLICY_NEW: "/policies/new",
  POLICY_EDIT: (id: string) => `/policies/${id}/edit` as const,
  EMAIL_TEMPLATES: "/email-templates",
  EMAIL_TEMPLATE_NEW: "/email-templates/new",
  EMAIL_TEMPLATE_DETAIL: (id: string) => `/email-templates/${id}` as const,
  EMAIL_TEMPLATE_EDIT: (id: string) => `/email-templates/${id}/edit` as const,
  SETTINGS: "/settings",
  SETTINGS_PROFILE: "/settings/profile",
  SETTINGS_WORKSPACE: "/settings/workspace",
  SETTINGS_SECURITY: "/settings/security",
  SETTINGS_ACCESS: "/settings/access",
  SETTINGS_BILLING: "/settings/billing",
  SETTINGS_BRANDING: "/settings/branding",
  SETTINGS_SSO: "/settings/sso",
  SETTINGS_AUDIT: "/settings/audit",
  SETTINGS_URL: "/settings/url",
} as const;

/**
 * Unified application route dictionary.
 */
export const ROUTES = {
  AUTH: AUTH_ROUTES,
  PLATFORM: PLATFORM_ROUTES,
  TENANT_PATHS,

  /**
   * Builds an explicit path-mode or custom route scoped to a tenant slug.
   */
  tenant: (tenantSlug?: string) => {
    const base = tenantSlug ? `/w/${encodeURIComponent(tenantSlug)}` : "";
    return {
      LOGIN: `${base}${AUTH_ROUTES.LOGIN}` as const,
      REGISTER: `${base}${AUTH_ROUTES.REGISTER}` as const,
      FORGOT_PASSWORD: `${base}${AUTH_ROUTES.FORGOT_PASSWORD}` as const,
      DASHBOARD: `${base}${TENANT_PATHS.DASHBOARD}` as const,
      LEADS: `${base}${TENANT_PATHS.LEADS}` as const,
      LEAD_NEW: `${base}${TENANT_PATHS.LEAD_NEW}` as const,
      LEAD_EDIT: (id: string) => `${base}${TENANT_PATHS.LEAD_EDIT(id)}` as const,
      FILES: `${base}${TENANT_PATHS.FILES}` as const,
      CHAT: `${base}${TENANT_PATHS.CHAT}` as const,
      ROLES: `${base}${TENANT_PATHS.ROLES}` as const,
      GROUPS: `${base}${TENANT_PATHS.GROUPS}` as const,
      TEAM: `${base}${TENANT_PATHS.TEAM}` as const,
      BILLING: `${base}${TENANT_PATHS.BILLING}` as const,
      BRANDING: `${base}${TENANT_PATHS.BRANDING}` as const,
      AUDIT_LOGS: `${base}${TENANT_PATHS.AUDIT_LOGS}` as const,
      POLICIES: `${base}${TENANT_PATHS.POLICIES}` as const,
      EMAIL_TEMPLATES: `${base}${TENANT_PATHS.EMAIL_TEMPLATES}` as const,
      SETTINGS: {
        ROOT: `${base}${TENANT_PATHS.SETTINGS}` as const,
        PROFILE: `${base}${TENANT_PATHS.SETTINGS_PROFILE}` as const,
        WORKSPACE: `${base}${TENANT_PATHS.SETTINGS_WORKSPACE}` as const,
        SECURITY: `${base}${TENANT_PATHS.SETTINGS_SECURITY}` as const,
        ACCESS: `${base}${TENANT_PATHS.SETTINGS_ACCESS}` as const,
        BILLING: `${base}${TENANT_PATHS.SETTINGS_BILLING}` as const,
        BRANDING: `${base}${TENANT_PATHS.SETTINGS_BRANDING}` as const,
        SSO: `${base}${TENANT_PATHS.SETTINGS_SSO}` as const,
        AUDIT: `${base}${TENANT_PATHS.SETTINGS_AUDIT}` as const,
        URL: `${base}${TENANT_PATHS.SETTINGS_URL}` as const,
      },
    };
  },
} as const;
