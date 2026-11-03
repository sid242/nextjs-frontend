import type { Metadata } from "next";

import { GroupFormPage } from "@/features/user-groups";

export const metadata: Metadata = {
  title: "Create User Group | Workspace Console",
  description: "Define a new user group for organizing members, bulk assignment, and workflows.",
};

export default function NewTenantGroupDirectPage() {
  return <GroupFormPage scope="TENANT" />;
}
