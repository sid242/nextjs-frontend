"use client";

import { useParams } from "next/navigation";

import { PLATFORM_PERMISSION_KEYS, PlatformPermissionGate } from "@/features/platform";
import { GroupFormPage } from "@/features/user-groups";

export default function EditPlatformGroupPage() {
  const params = useParams<{ id: string }>();
  const groupId = params?.id ?? "";

  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.GROUPS_UPDATE}>
      <GroupFormPage scope="PLATFORM" groupId={groupId} />
    </PlatformPermissionGate>
  );
}
