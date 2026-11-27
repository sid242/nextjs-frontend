import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

import { TENANT_PERMISSIONS } from "@/config/permissions";
import { useTenantContext } from "@/features/tenants";

import { whatsappKeys } from "../keys";
import { WhatsAppCampaignsTab } from "./whatsapp-campaigns-tab";

vi.mock("@/features/tenants", () => ({
  useTenantContext: vi.fn(),
  hasTenantPermission: (permissions: string[] | undefined, permission: string) =>
    permissions?.includes(permission) === true,
}));

function renderCampaigns(...permissions: string[]) {
  vi.mocked(useTenantContext).mockReturnValue({
    data: { permissions },
  } as ReturnType<typeof useTenantContext>);
  const client = new QueryClient();
  client.setQueryData(whatsappKeys.campaigns(), [
    {
      id: "draft-1",
      name: "Workspace update",
      status: "DRAFT",
      createdAt: "2026-01-01T10:00:00Z",
    },
  ]);
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <WhatsAppCampaignsTab />
    </QueryClientProvider>,
  );
}

it("shows campaign details without exposing mutations to read-only members", () => {
  const html = renderCampaigns(TENANT_PERMISSIONS.WHATSAPP_CAMPAIGN_READ);
  expect(html).toContain("Workspace update");
  expect(html).not.toContain("Create Campaign");
  expect(html).not.toContain("Launch / Schedule");
  expect(html).not.toContain("Actions");
});

it("keeps campaign creation and management permissions independent", () => {
  const writer = renderCampaigns(
    TENANT_PERMISSIONS.WHATSAPP_CAMPAIGN_READ,
    TENANT_PERMISSIONS.WHATSAPP_CAMPAIGN_WRITE,
    TENANT_PERMISSIONS.WHATSAPP_TEMPLATE_READ,
  );
  expect(writer).toContain("Create Campaign");
  expect(writer).not.toContain("Launch / Schedule");

  const manager = renderCampaigns(
    TENANT_PERMISSIONS.WHATSAPP_CAMPAIGN_READ,
    TENANT_PERMISSIONS.WHATSAPP_CAMPAIGN_MANAGE,
  );
  expect(manager).toContain("Launch / Schedule");
  expect(manager).toContain("Cancel");
  expect(manager).not.toContain("Create Campaign");
});
