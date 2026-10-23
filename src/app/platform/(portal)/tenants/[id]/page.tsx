import type { Metadata } from "next";

import { TenantInspector } from "@/features/platform";

export const metadata: Metadata = {
  title: "Workspace Inspector | Platform Operator Portal",
  description: "Detailed tenant organization profile, database pool, and subscription allocation.",
};

interface TenantDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TenantDetailPage({ params }: TenantDetailPageProps) {
  const { id } = await params;

  return <TenantInspector tenantId={id} />;
}
