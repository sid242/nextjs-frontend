import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { resolveInitialTab, usePersistedTab } from "./use-persisted-tab";

function DummyTabComponent() {
  const [activeTab] = usePersistedTab({
    defaultTab: "overview",
    allowedTabs: ["overview", "templates", "campaigns"] as const,
  });
  return React.createElement("div", null, "Active: ", activeTab);
}

describe("usePersistedTab", () => {
  describe("resolveInitialTab", () => {
    it("returns paramValue if present in allowedTabs", () => {
      const tab = resolveInitialTab({
        paramValue: "templates",
        storedValue: "campaigns",
        defaultTab: "overview",
        allowedTabs: ["overview", "templates", "campaigns"] as const,
      });
      expect(tab).toBe("templates");
    });

    it("falls back to storedValue if paramValue is missing or invalid", () => {
      const tab = resolveInitialTab({
        paramValue: "invalid",
        storedValue: "campaigns",
        defaultTab: "overview",
        allowedTabs: ["overview", "templates", "campaigns"] as const,
      });
      expect(tab).toBe("campaigns");
    });

    it("falls back to defaultTab if both param and storage are missing/invalid", () => {
      const tab = resolveInitialTab({
        paramValue: null,
        storedValue: null,
        defaultTab: "overview",
        allowedTabs: ["overview", "templates", "campaigns"] as const,
      });
      expect(tab).toBe("overview");
    });

    it("falls back to the first allowedTab if defaultTab is not in allowedTabs", () => {
      const tab = resolveInitialTab({
        paramValue: null,
        storedValue: null,
        defaultTab: "overview",
        allowedTabs: ["templates", "campaigns"] as const,
      });
      expect(tab).toBe("templates");
    });
  });

  describe("component hook execution", () => {
    it("renders with the default tab during SSR/static markup", () => {
      const html = renderToStaticMarkup(React.createElement(DummyTabComponent));
      expect(html).toContain("Active: overview");
    });
  });
});
