import type { Metadata } from "next";

import { WhatsAppIntegrationCard } from "@/features/whatsapp";

export const metadata: Metadata = {
  title: "WhatsApp API & Integration Settings",
  description:
    "Manage WhatsApp Business Account credentials, Meta webhook, and verified phone numbers.",
};

export default function WhatsAppSettingsPage() {
  return <WhatsAppIntegrationCard />;
}
