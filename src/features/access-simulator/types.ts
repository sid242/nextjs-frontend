export interface PermissionSource {
  roleId: string;
  roleName: string;
  roleCode: string;
  source: "DIRECT" | "GROUP";
  groupId?: string;
  groupName?: string;
}

export interface PermissionProvenance {
  key: string;
  name: string;
  action: string;
  moduleKey?: string | null;
  moduleName?: string | null;
  isAllowed: boolean;
  denialReason?: string | null;
  sources: PermissionSource[];
}

export interface EffectiveAccessResult {
  user: {
    id: string;
    name: string | null;
    email: string;
    status: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    plan: string;
  };
  membership: {
    id: string;
    status: string;
    joinedAt: string | null;
  } | null;
  isEffectiveActive: boolean;
  overallDenialReason: string | null;
  directRoles: Array<{
    id: string;
    name: string;
    code: string;
    description: string | null;
    isSystem: boolean;
  }>;
  groups: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    roles: Array<{ id: string; name: string; code: string }>;
  }>;
  groupRoles: Array<{
    id: string;
    name: string;
    code: string;
    groupName: string;
  }>;
  effectiveRoles: string[];
  effectivePermissions: string[];
  permissionsProvenance: PermissionProvenance[];
}

export interface SimulateAccessInput {
  userId: string;
  permission: string;
  resourceType?: string;
  resourceId?: string;
}

export interface SimulationResult {
  allowed: boolean;
  reason: string;
  evaluationTrace: string[];
  matchedRoles: string[];
  matchedGroups: string[];
}
