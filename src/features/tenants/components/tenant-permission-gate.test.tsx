import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { TenantPermissionGate } from "./tenant-permission-gate";

// Mock queries
const mockUseActiveTenant = vi.fn();
const mockUseTenantContext = vi.fn();
vi.mock("../queries", () => ({
  useActiveTenant: () => mockUseActiveTenant(),
  useTenantContext: () => mockUseTenantContext(),
}));

// Mock tenancy helpers
const mockUseTenantUrl = vi.fn();
vi.mock("@/lib/tenancy", () => ({
  useTenantHref: () => (path: string) => `/w/test-workspace${path}`,
  useTenantUrl: () => mockUseTenantUrl(),
}));

// Mock platform hook
const mockUsePlatformMe = vi.fn();
vi.mock("@/features/platform", () => ({
  usePlatformMe: () => mockUsePlatformMe(),
}));

// Mock useParams
vi.mock("next/navigation", () => ({
  useParams: () => ({ tenantSlug: "test-workspace" }),
}));

describe("TenantPermissionGate Component Tests", () => {
  it("renders loading skeleton when tenant or context is loading", () => {
    mockUseActiveTenant.mockReturnValue({ activeTenant: null, isLoading: true });
    mockUseTenantContext.mockReturnValue({ data: null, isLoading: false });
    mockUseTenantUrl.mockReturnValue({ hasPlatformSession: false });
    mockUsePlatformMe.mockReturnValue({ data: null });

    const html = renderToStaticMarkup(
      <TenantPermissionGate permission="leads:read">
        <div>Protected Member Area</div>
      </TenantPermissionGate>,
    );

    expect(html).not.toContain("Protected Member Area");
    expect(html).toContain("animate-pulse");
  });

  it("renders null during loading when hideInsteadOfBanner is true", () => {
    mockUseActiveTenant.mockReturnValue({ activeTenant: null, isLoading: true });
    mockUseTenantContext.mockReturnValue({ data: null, isLoading: false });
    mockUseTenantUrl.mockReturnValue({ hasPlatformSession: false });

    const html = renderToStaticMarkup(
      <TenantPermissionGate permission="leads:read" hideInsteadOfBanner>
        <div>Protected Member Area</div>
      </TenantPermissionGate>,
    );

    expect(html).toBe("");
  });

  it("renders Module Unavailable banner when required module is disabled for tenant", () => {
    mockUseActiveTenant.mockReturnValue({
      activeTenant: { id: "tenant-1", name: "Test Corp", slug: "test-workspace" },
      isLoading: false,
    });
    mockUseTenantContext.mockReturnValue({
      data: {
        permissions: ["leads:read", "leads:write"],
        businessModules: {
          leads: false,
        },
      },
      isLoading: false,
    });
    mockUseTenantUrl.mockReturnValue({ hasPlatformSession: false });
    mockUsePlatformMe.mockReturnValue({ data: null });

    const html = renderToStaticMarkup(
      <TenantPermissionGate permission="leads:read" module="leads">
        <div>Leads Management</div>
      </TenantPermissionGate>,
    );

    expect(html).not.toContain("Leads Management");
    expect(html).toContain("Module unavailable");
    expect(html).toContain("This module is unavailable in your workspace.");
    expect(html).toContain("/w/test-workspace/dashboard");
  });

  it("renders children when tenant member has required permission", () => {
    mockUseActiveTenant.mockReturnValue({
      activeTenant: { id: "tenant-1", name: "Test Corp", slug: "test-workspace" },
      isLoading: false,
    });
    mockUseTenantContext.mockReturnValue({
      data: {
        permissions: ["leads:read", "leads:write"],
        businessModules: {
          leads: true,
        },
      },
      isLoading: false,
    });
    mockUseTenantUrl.mockReturnValue({ hasPlatformSession: false });

    const html = renderToStaticMarkup(
      <TenantPermissionGate permission="leads:read" module="leads">
        <div>Leads Pipeline View</div>
      </TenantPermissionGate>,
    );

    expect(html).toContain("Leads Pipeline View");
    expect(html).not.toContain("Access Restricted");
  });

  it("renders Access Restricted when member lacks permission", () => {
    mockUseActiveTenant.mockReturnValue({
      activeTenant: { id: "tenant-1", name: "Test Corp", slug: "test-workspace" },
      isLoading: false,
    });
    mockUseTenantContext.mockReturnValue({
      data: {
        permissions: ["members:read"],
        businessModules: {},
      },
      isLoading: false,
    });
    mockUseTenantUrl.mockReturnValue({ hasPlatformSession: false });
    mockUsePlatformMe.mockReturnValue({ data: null });

    const html = renderToStaticMarkup(
      <TenantPermissionGate permission="billing:read">
        <div>Secret Financials</div>
      </TenantPermissionGate>,
    );

    expect(html).not.toContain("Secret Financials");
    expect(html).toContain("Access Restricted");
    expect(html).toContain("billing:read");
    expect(html).toContain("Test Corp");
  });

  it("renders fallback when member lacks permission and fallback is provided", () => {
    mockUseActiveTenant.mockReturnValue({
      activeTenant: { id: "tenant-1", name: "Test Corp", slug: "test-workspace" },
      isLoading: false,
    });
    mockUseTenantContext.mockReturnValue({
      data: {
        permissions: [],
        businessModules: {},
      },
      isLoading: false,
    });
    mockUseTenantUrl.mockReturnValue({ hasPlatformSession: false });

    const html = renderToStaticMarkup(
      <TenantPermissionGate
        permission="billing:read"
        fallback={<div>Please contact workspace admin to unlock</div>}
      >
        <div>Secret Financials</div>
      </TenantPermissionGate>,
    );

    expect(html).not.toContain("Secret Financials");
    expect(html).not.toContain("Access Restricted");
    expect(html).toContain("Please contact workspace admin to unlock");
  });

  it("renders zero-standing banner for platform staff operator without support delegation", () => {
    mockUseActiveTenant.mockReturnValue({
      activeTenant: { id: "tenant-1", name: "Acme Customer", slug: "acme-customer" },
      isLoading: false,
    });
    mockUseTenantContext.mockReturnValue({
      data: {
        permissions: [],
        businessModules: {},
      },
      isLoading: false,
    });
    mockUseTenantUrl.mockReturnValue({ hasPlatformSession: true });
    mockUsePlatformMe.mockReturnValue({
      data: {
        id: "staff-101",
        email: "staff@platform.internal",
      },
    });

    const html = renderToStaticMarkup(
      <TenantPermissionGate permission="settings:update">
        <div>Customer Settings</div>
      </TenantPermissionGate>,
    );

    expect(html).not.toContain("Customer Settings");
    expect(html).toContain("Platform Staff Operator");
    expect(html).toContain("Zero-Standing Customer Privileges");
    expect(html).toContain("Initiate Audited Support Session");
  });
});
