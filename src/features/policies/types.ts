export type PolicyEffect = "allow" | "deny";

export type ConditionOperator =
  "$eq" | "$ne" | "$in" | "$nin" | "$gt" | "$gte" | "$lt" | "$lte" | "$contains" | "$startsWith";

export interface AttributeCondition {
  attribute: string;
  operator: ConditionOperator;
  value: string | number | boolean | Array<string | number> | null;
}

export interface ConditionRule {
  all?: Array<AttributeCondition | ConditionRule>;
  any?: Array<AttributeCondition | ConditionRule>;
  none?: Array<AttributeCondition | ConditionRule>;
}

export type PolicyConditionTree = ConditionRule | AttributeCondition | Record<string, unknown>;

export interface Policy {
  id: string;
  tenantId: string | null;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  effect: PolicyEffect;
  conditions: PolicyConditionTree;
  isActive: boolean;
  priority: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolicyInput {
  name: string;
  description?: string;
  resource: string;
  action: string;
  effect: PolicyEffect;
  conditions: PolicyConditionTree;
  priority?: number;
  isActive?: boolean;
}

export interface UpdatePolicyInput {
  name?: string;
  description?: string;
  resource?: string;
  action?: string;
  effect?: PolicyEffect;
  conditions?: PolicyConditionTree;
  priority?: number;
  isActive?: boolean;
}

export interface ListPoliciesFilter {
  resource?: string;
  action?: string;
  effect?: PolicyEffect;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}
