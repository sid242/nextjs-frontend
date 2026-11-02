import { redirect } from "next/navigation";

export default async function BrandingRedirectPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  redirect(`/w/${tenantSlug}/settings/branding`);
}
