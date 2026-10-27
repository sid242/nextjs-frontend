import type { Metadata } from "next";

import {
  PLATFORM_PERMISSION_KEYS,
  PlatformPermissionGate,
  RoleFormPage,
} from "@/features/platform";

export const metadata: Metadata = {
  title: "Edit Platform Role | Platform Operator Portal",
  description:
    "Modify name, description, and canonical permission grants for this operational platform role.",
};

interface EditRolePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPlatformRolePage({ params }: EditRolePageProps) {
  const { id } = await params;

  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.ROLES_MANAGE}>
      <RoleFormPage roleId={id} />
    </PlatformPermissionGate>
  );
}
