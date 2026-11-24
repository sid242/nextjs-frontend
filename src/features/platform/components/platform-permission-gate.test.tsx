import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { PlatformPermissionGate } from "./platform-permission-gate";

// Mock queries module
const mockUsePlatformMe = vi.fn();
vi.mock("../queries", () => ({
  usePlatformMe: () => mockUsePlatformMe(),
}));

describe("PlatformPermissionGate Component Tests", () => {
  it("renders loading skeleton when staff data is loading", () => {
    mockUsePlatformMe.mockReturnValue({ data: null, isLoading: true });

    const html = renderToStaticMarkup(
      <PlatformPermissionGate permission="platform:users:read">
        <div data-testid="protected-content">Secret Content</div>
      </PlatformPermissionGate>,
    );

    expect(html).not.toContain("Secret Content");
    expect(html).toContain("animate-pulse"); // Skeleton class
  });

  it("renders null during loading when hideInsteadOfBanner is true", () => {
    mockUsePlatformMe.mockReturnValue({ data: null, isLoading: true });

    const html = renderToStaticMarkup(
      <PlatformPermissionGate permission="platform:users:read" hideInsteadOfBanner>
        <div data-testid="protected-content">Secret Content</div>
      </PlatformPermissionGate>,
    );

    expect(html).toBe("");
  });

  it("renders children when staff member has required permission", () => {
    mockUsePlatformMe.mockReturnValue({
      data: {
        id: "staff-1",
        email: "staff@example.com",
        roleKey: "SUPPORT",
        permissions: ["platform:users:read"],
      },
      isLoading: false,
    });

    const html = renderToStaticMarkup(
      <PlatformPermissionGate permission="platform:users:read">
        <div data-testid="protected-content">Authorized Staff Area</div>
      </PlatformPermissionGate>,
    );

    expect(html).toContain("Authorized Staff Area");
    expect(html).not.toContain("Access Restricted");
  });

  it("renders children when staff member has SUPER_ADMIN role (wildcard access)", () => {
    mockUsePlatformMe.mockReturnValue({
      data: {
        id: "admin-1",
        email: "admin@example.com",
        roleKey: "SUPER_ADMIN",
        permissions: [],
      },
      isLoading: false,
    });

    const html = renderToStaticMarkup(
      <PlatformPermissionGate permission="platform:financials:export">
        <div data-testid="protected-content">Admin Only Area</div>
      </PlatformPermissionGate>,
    );

    expect(html).toContain("Admin Only Area");
    expect(html).not.toContain("Access Restricted");
  });

  it("renders children when staff member matches at least one permission in an array", () => {
    mockUsePlatformMe.mockReturnValue({
      data: {
        id: "staff-2",
        email: "staff2@example.com",
        roleKey: "SUPPORT",
        permissions: ["platform:tenants:read"],
      },
      isLoading: false,
    });

    const html = renderToStaticMarkup(
      <PlatformPermissionGate permission={["platform:tenants:write", "platform:tenants:read"]}>
        <div data-testid="protected-content">Tenant Details</div>
      </PlatformPermissionGate>,
    );

    expect(html).toContain("Tenant Details");
  });

  it("renders Access Restricted banner when staff lacks required permission", () => {
    mockUsePlatformMe.mockReturnValue({
      data: {
        id: "staff-3",
        email: "junior@example.com",
        roleKey: "JUNIOR_OPERATOR",
        roleName: "Junior Operator",
        permissions: ["platform:dashboard:read"],
      },
      isLoading: false,
    });

    const html = renderToStaticMarkup(
      <PlatformPermissionGate permission="platform:security:audit">
        <div data-testid="protected-content">Audit Trail</div>
      </PlatformPermissionGate>,
    );

    expect(html).not.toContain("Audit Trail");
    expect(html).toContain("Access Restricted");
    expect(html).toContain("platform:security:audit");
    expect(html).toContain("Junior Operator");
  });

  it("renders custom fallback node when access is denied and fallback is provided", () => {
    mockUsePlatformMe.mockReturnValue({
      data: {
        id: "staff-4",
        email: "viewer@example.com",
        roleKey: "VIEWER",
        permissions: [],
      },
      isLoading: false,
    });

    const html = renderToStaticMarkup(
      <PlatformPermissionGate
        permission="platform:billing:manage"
        fallback={<div data-testid="custom-fallback">Upgrade permission to view</div>}
      >
        <div data-testid="protected-content">Billing Settings</div>
      </PlatformPermissionGate>,
    );

    expect(html).not.toContain("Billing Settings");
    expect(html).not.toContain("Access Restricted");
    expect(html).toContain("Upgrade permission to view");
  });

  it("renders null when access is denied and hideInsteadOfBanner is true", () => {
    mockUsePlatformMe.mockReturnValue({
      data: {
        id: "staff-5",
        email: "viewer@example.com",
        roleKey: "VIEWER",
        permissions: [],
      },
      isLoading: false,
    });

    const html = renderToStaticMarkup(
      <PlatformPermissionGate permission="platform:billing:manage" hideInsteadOfBanner>
        <div data-testid="protected-content">Billing Button</div>
      </PlatformPermissionGate>,
    );

    expect(html).toBe("");
  });
});
