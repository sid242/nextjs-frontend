"use client";

import { useParams } from "next/navigation";

import { PLATFORM_PERMISSION_KEYS, PlatformPermissionGate } from "@/features/platform";
import { GroupDetailsPage } from "@/features/user-groups";

export default function PlatformGroupDetailsRoute() {
  const params = useParams<{ id: string }>();
  const groupId = params?.id ?? "";

  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.GROUPS_READ}>
      <GroupDetailsPage scope="PLATFORM" groupId={groupId} />
    </PlatformPermissionGate>
  );
}
