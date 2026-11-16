"use client";

import { useParams } from "next/navigation";

import {
  PLATFORM_PERMISSION_KEYS,
  PlatformPermissionGate,
  PlatformPolicyFormPage,
} from "@/features/platform";

export default function EditPlatformPolicyRoute() {
  const params = useParams<{ policyId: string }>();
  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.ROLES_MANAGE}>
      <PlatformPolicyFormPage policyId={params?.policyId} />
    </PlatformPermissionGate>
  );
}
