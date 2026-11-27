import type { Metadata } from "next";

import { PlatformAccountView } from "@/features/platform";

export const metadata: Metadata = {
  title: "Account & Security · Platform Console",
  description:
    "Manage your platform operator profile credentials, authentication settings, and two-factor verification.",
};

export default function PlatformAccountPage() {
  return <PlatformAccountView />;
}
