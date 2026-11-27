import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { expect, it, vi } from "vitest";

import { TENANT_PATHS } from "@/config/routes";

import WhatsAppRedirectPage from "./page";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("redirect");
  }),
}));

it.each([
  ["path", `/w/workspace${TENANT_PATHS.SETTINGS_INTEGRATIONS_WHATSAPP}`],
  ["subdomain", TENANT_PATHS.SETTINGS_INTEGRATIONS_WHATSAPP],
  ["customDomain", TENANT_PATHS.SETTINGS_INTEGRATIONS_WHATSAPP],
])("keeps legacy WhatsApp settings links in %s URL mode", async (mode, destination) => {
  vi.mocked(headers).mockResolvedValue(
    new Headers({ "x-tenant-slug": "workspace", "x-tenant-mode": mode }),
  );
  await expect(
    WhatsAppRedirectPage({ params: Promise.resolve({ tenantSlug: "workspace" }) }),
  ).rejects.toThrow("redirect");
  expect(redirect).toHaveBeenLastCalledWith(destination);
});
