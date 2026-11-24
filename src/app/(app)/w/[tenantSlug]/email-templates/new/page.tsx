"use client";

import { TemplateStudio } from "@/features/email-templates";
import { TENANT_PERMISSIONS, TenantPermissionGate } from "@/features/tenants";

export default function NewEmailTemplatePage() {
  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.EMAIL_TEMPLATES_WRITE}>
      <TemplateStudio />
    </TenantPermissionGate>
  );
}
