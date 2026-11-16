import {
  PLATFORM_PERMISSION_KEYS,
  PlatformPermissionGate,
  PlatformPoliciesTable,
} from "@/features/platform";

export const metadata = {
  title: "Platform PBAC Policies | Internal Console",
  description:
    "Author and govern attribute-based access control policies across platform operations.",
};

export default function PlatformPoliciesPage() {
  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.ROLES_READ}>
      <div className="space-y-6">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Platform Access Policies
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure dynamic Policy-Based Access Control (PBAC) rules and attribute constraints
            enforced across platform operator workflows.
          </p>
        </div>
        <PlatformPoliciesTable />
      </div>
    </PlatformPermissionGate>
  );
}
