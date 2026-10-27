import type { Metadata } from "next";

import {
  PLATFORM_PERMISSION_KEYS,
  PlatformPermissionGate,
  RoleFormPage,
} from "@/features/platform";

export const metadata: Metadata = {
  title: "Create Platform Role | Platform Operator Portal",
  description: "Define a new custom operational platform role with granular canonical permissions.",
};

export default function NewPlatformRolePage() {
  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.ROLES_MANAGE}>
      <RoleFormPage />
    </PlatformPermissionGate>
  );
}
