"use client";

import {
  PLATFORM_PERMISSION_KEYS,
  PlatformPermissionGate,
  PlatformPolicyFormPage,
} from "@/features/platform";

export default function NewPlatformPolicyRoute() {
  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.ROLES_MANAGE}>
      <PlatformPolicyFormPage />
    </PlatformPermissionGate>
  );
}
