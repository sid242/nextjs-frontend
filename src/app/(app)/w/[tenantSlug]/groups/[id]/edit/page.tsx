"use client";

import { useParams } from "next/navigation";

import { GroupFormPage } from "@/features/user-groups";

export default function EditTenantGroupPage() {
  const params = useParams<{ id: string }>();
  const groupId = params?.id ?? "";

  return <GroupFormPage scope="TENANT" groupId={groupId} />;
}
