import { AuditLogsTable } from "@/features/platform";

export const metadata = {
  title: "Platform Compliance Audit Trail | Internal Console",
  description:
    "Security and compliance audit trail inspecting all operator actions across the platform.",
};

export default function PlatformAuditLogsPage() {
  return <AuditLogsTable />;
}
