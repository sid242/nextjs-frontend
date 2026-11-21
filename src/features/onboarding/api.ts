import { api } from "@/lib/api/http";

import type { OnboardingOverview, UpdateStepProgressInput } from "./types";

export const getOnboardingOverview = (tenantId: string) =>
  api.get<OnboardingOverview>(`/tenants/${tenantId}/onboarding`);

export const updateStepProgress = (
  tenantId: string,
  stepKey: string,
  input: UpdateStepProgressInput,
) => api.patch(`/tenants/${tenantId}/onboarding/steps/${stepKey}`, input);

export const skipStep = (tenantId: string, stepKey: string) =>
  api.post(`/tenants/${tenantId}/onboarding/steps/${stepKey}/skip`);
