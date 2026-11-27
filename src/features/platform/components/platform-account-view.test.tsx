import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { PlatformAccountView } from "./platform-account-view";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/features/notifications", () => ({
  PushSettingsCard: () => <div>Push Settings Card</div>,
}));

vi.mock("../queries", () => ({
  usePlatformMe: () => ({
    data: {
      displayName: "Arthur Pendelton",
      email: "staff@platform.local",
      roleKey: "SUPER_ADMIN",
      roleName: "Super Administrator",
    },
    isLoading: false,
  }),
  useUpdatePlatformProfile: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useChangePlatformPassword: () => ({ mutateAsync: vi.fn(), isPending: false }),
  usePlatformTwoFactorStatus: () => ({
    data: { enabled: true, enabledAt: "2026-01-01T00:00:00Z" },
    isLoading: false,
  }),
  useSetupPlatformTwoFactor: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEnablePlatformTwoFactor: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDisablePlatformTwoFactor: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("PlatformAccountView", () => {
  it("renders tabs and profile section correctly", () => {
    const html = renderToStaticMarkup(<PlatformAccountView />);
    expect(html).toContain("Account &amp; Security");
    expect(html).toContain("Profile &amp; Identity");
    expect(html).toContain("Password &amp; Security");
    expect(html).toContain("Two-Factor Authentication");
    expect(html).toContain("Notifications &amp; Push");
    expect(html).toContain("Arthur Pendelton");
    expect(html).toContain("staff@platform.local");
  });
});
