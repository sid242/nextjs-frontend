import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

export default async function WhatsAppRedirectPage({ params }: PageProps) {
  const { tenantSlug } = await params;
  redirect(`/w/${tenantSlug}/settings/integrations/whatsapp`);
}
