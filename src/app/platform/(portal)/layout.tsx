import { type ReactNode } from "react";

import { PlatformShell } from "@/features/platform";
import { requirePlatformStaff } from "@/lib/server/platform-session";

export const metadata = {
  title: "SaaS Platform Management Portal",
  description:
    "Internal operator control plane, canonical permissions, support sessions, and compliance audit trail.",
};

export default async function PlatformPortalLayout({ children }: { children: ReactNode }) {
  await requirePlatformStaff();
  return <PlatformShell>{children}</PlatformShell>;
}
