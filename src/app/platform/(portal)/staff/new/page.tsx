import type { Metadata } from "next";

import {
  PLATFORM_PERMISSION_KEYS,
  PlatformPermissionGate,
  StaffFormPage,
} from "@/features/platform";

export const metadata: Metadata = {
  title: "Provision Staff Member | Platform Operator Portal",
  description:
    "Provision a new internal platform staff member and assign canonical operational roles.",
};

export default function NewStaffMemberPage() {
  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.STAFF_CREATE}>
      <StaffFormPage />
    </PlatformPermissionGate>
  );
}
