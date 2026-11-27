import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import WhatsAppPage, { metadata } from "./page";

vi.mock("@/features/whatsapp", () => ({
  WhatsAppSettingsView: () => (
    <div data-testid="whatsapp-settings-view">WhatsApp Settings View</div>
  ),
}));

describe("WhatsAppPage", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toBe("WhatsApp Business");
  });

  it("renders WhatsAppSettingsView", () => {
    const html = renderToStaticMarkup(<WhatsAppPage />);
    expect(html).toContain("WhatsApp Settings View");
  });
});
