import { PlatformSupportQueue } from "@/features/support";

export const metadata = {
  title: "Customer Support Queue",
  description: "Internal operator helpdesk queue, customer ticket triage, and user feedback.",
};

export default function PlatformSupportPage() {
  return (
    <div className="space-y-6">
      <PlatformSupportQueue />
    </div>
  );
}
