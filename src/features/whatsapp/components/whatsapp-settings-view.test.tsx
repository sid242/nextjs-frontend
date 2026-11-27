import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

import { TENANT_PERMISSIONS } from "@/config/permissions";
import { useTenantContext } from "@/features/tenants";

import { WhatsAppSettingsView } from "./whatsapp-settings-view";

vi.mock("@/features/tenants", () => {
  const useTenantContext = vi.fn();
  const hasTenantPermission = (permissions: string[] | undefined, permission: string | string[]) =>
    [permission].flat().some((key) => permissions?.includes(key));

  return {
    useTenantContext,
    hasTenantPermission,
    TenantPermissionGate: ({
      permission,
      children,
    }: {
      permission: string[];
      children: ReactNode;
    }) =>
      hasTenantPermission(useTenantContext()?.data?.permissions, permission) ? (
        children
      ) : (
        <p>Access Restricted</p>
      ),
  };
});

vi.mock("@/lib/i18n", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("./whatsapp-campaigns-tab", () => ({ WhatsAppCampaignsTab: () => <p>Campaign list</p> }));

function renderSettings(permissions: string[]) {
  vi.mocked(useTenantContext).mockReturnValue({
    data: { permissions },
  } as ReturnType<typeof useTenantContext>);
  return renderToStaticMarkup(<WhatsAppSettingsView />);
}

it("opens the first allowed tab for a campaign reader who cannot read the business account", () => {
  const html = renderSettings([TENANT_PERMISSIONS.WHATSAPP_CAMPAIGN_READ]);
  expect(html).toContain("Campaign list");
  expect(html).toContain("whatsapp.campaigns");
  expect(html).not.toContain("whatsapp.overview");
  expect(html).not.toContain("whatsapp.account");
});

it("restricts direct settings access when the member has no WhatsApp read permission", () => {
  const html = renderSettings([TENANT_PERMISSIONS.TENANTS_UPDATE]);
  expect(html).toContain("Access Restricted");
  expect(html).not.toContain('role="tablist"');
});
