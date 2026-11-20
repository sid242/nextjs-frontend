export type FeatureFlagType = "BOOLEAN" | "PERCENT" | "VARIANT";
export type FeatureFlagTarget = "TENANT" | "PLAN" | "USER" | "PERCENT" | "ENV";

export interface FeatureFlagRule {
  id: string;
  flagId: string;
  flagKey: string;
  priority: number;
  target: FeatureFlagTarget;
  matchCriteria: unknown;
  value: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  type: FeatureFlagType;
  defaultValue: unknown;
  ownerStaffId: string | null;
  killSwitch: boolean;
  tags: string[] | null;
  lastEvaluatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagWithRules extends FeatureFlag {
  rules: FeatureFlagRule[];
}
