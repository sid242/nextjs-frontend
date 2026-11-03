"use client";

import { useParams } from "next/navigation";

import { GroupDetailsPage } from "@/features/user-groups";

export default function TenantGroupDetailsDirectPage() {
  const params = useParams<{ id: string }>();
  const groupId = params?.id ?? "";

  return <GroupDetailsPage scope="TENANT" groupId={groupId} />;
}
