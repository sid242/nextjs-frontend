import type { Metadata } from "next";

import { WhatsAppSettingsView } from "@/features/whatsapp";

export const metadata: Metadata = {
  title: "WhatsApp Business",
  description:
    "Manage WhatsApp Business Account, phone numbers, templates, conversations, and campaigns.",
};

export default function WhatsAppPage() {
  return <WhatsAppSettingsView />;
}
