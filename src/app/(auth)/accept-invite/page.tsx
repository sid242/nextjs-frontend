import type { Metadata } from "next";

import { AcceptInviteForm } from "@/features/auth";

export const metadata: Metadata = { title: "Accept Invitation" };

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <AcceptInviteForm />
    </div>
  );
}
