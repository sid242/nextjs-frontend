import { TENANT_PERMISSIONS } from "./permissions";
import { TENANT_PATHS } from "./routes";

export const WORKSPACE_MODULES = {
  leads: {
    navigation: {
      title: "CRM Leads",
      href: TENANT_PATHS.LEADS,
      icon: "circle",
      permission: TENANT_PERMISSIONS.LEADS_READ,
      module: "leads",
    },
  },
} as const;

export type WorkspaceModuleKey = keyof typeof WORKSPACE_MODULES;
export type WorkspaceModuleAvailability = Partial<Record<WorkspaceModuleKey, boolean>>;
