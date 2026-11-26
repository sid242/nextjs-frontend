import { redirect } from "next/navigation";

interface SettingsPageProps {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function TenantSettingsPage({ params, searchParams }: SettingsPageProps) {
  const { tenantSlug } = await params;
  const resolved = await searchParams;
  const tab = resolved?.tab;

  if (tab === "notifications") redirect(`/w/${tenantSlug}/settings/notifications`);
  if (tab === "workspace") redirect(`/w/${tenantSlug}/settings/workspace`);
  if (tab === "smtp" || tab === "email") redirect(`/w/${tenantSlug}/settings/email`);
  if (tab === "whatsapp") redirect(`/w/${tenantSlug}/settings/integrations/whatsapp`);
  if (tab === "security") redirect(`/w/${tenantSlug}/settings/security`);

  redirect(`/w/${tenantSlug}/settings/profile`);
}
