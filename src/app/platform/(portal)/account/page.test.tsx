import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import PlatformAccountPage, { metadata } from "./page";

vi.mock("@/features/platform", () => ({
  PlatformAccountView: () => <div data-testid="platform-account-view">Platform Account View</div>,
}));

describe("PlatformAccountPage", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toBe("Account & Security · Platform Console");
  });

  it("renders PlatformAccountView", () => {
    const html = renderToStaticMarkup(<PlatformAccountPage />);
    expect(html).toContain("Platform Account View");
  });
});
