import { RolesMatrix } from "@/features/platform";

export const metadata = {
  title: "Platform Roles & Permissions | Internal Console",
  description:
    "Configure system & custom platform roles with canonical resource::action permissions.",
};

export default function PlatformRolesPage() {
  return <RolesMatrix />;
}
