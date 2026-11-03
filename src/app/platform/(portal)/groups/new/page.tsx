import type { Metadata } from "next";

import { PLATFORM_PERMISSION_KEYS, PlatformPermissionGate } from "@/features/platform";
import { GroupFormPage } from "@/features/user-groups";

export const metadata: Metadata = {
  title: "Create Staff Group | Internal Console",
  description: "Define a new platform staff group for internal operations and team governance.",
};

export default function NewPlatformGroupPage() {
  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.GROUPS_CREATE}>
      <GroupFormPage scope="PLATFORM" />
    </PlatformPermissionGate>
  );
}
