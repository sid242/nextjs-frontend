import { type ReactNode } from "react";

import { PlatformShell } from "@/features/platform";

export const metadata = {
  title: "SaaS Platform Management Portal",
  description:
    "Internal operator control plane, canonical permissions, support sessions, and compliance audit trail.",
};

export default function PlatformPortalLayout({ children }: { children: ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>;
}
