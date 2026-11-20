import { describe, expect, it } from "vitest";

import {
  getIconComponent,
  normalizeIconName,
  registerCustomIcons,
  type CustomIconComponent,
} from "@/components/ui/icon";

import { ControlledIconPicker, FormIconPicker, IconPicker } from "./index";

describe("DynamicIcon & IconPicker Unit Tests", () => {
  describe("1. normalizeIconName", () => {
    it("handles empty or falsy inputs safely", () => {
      expect(normalizeIconName("")).toBe("");
    });

    it("normalizes kebab-case to PascalCase", () => {
      expect(normalizeIconName("folder-plus")).toBe("FolderPlus");
      expect(normalizeIconName("calendar-days")).toBe("CalendarDays");
      expect(normalizeIconName("arrow-up-right")).toBe("ArrowUpRight");
      expect(normalizeIconName("building-2")).toBe("Building2");
    });

    it("normalizes snake_case to PascalCase", () => {
      expect(normalizeIconName("user_check")).toBe("UserCheck");
      expect(normalizeIconName("file_text")).toBe("FileText");
    });

    it("normalizes lowercase words to PascalCase", () => {
      expect(normalizeIconName("search")).toBe("Search");
      expect(normalizeIconName("folder")).toBe("Folder");
      expect(normalizeIconName("check")).toBe("Check");
    });

    it("preserves already PascalCase names", () => {
      expect(normalizeIconName("FolderPlus")).toBe("FolderPlus");
      expect(normalizeIconName("Calendar")).toBe("Calendar");
      expect(normalizeIconName("Trash2")).toBe("Trash2");
    });
  });

  describe("2. getIconComponent resolution", () => {
    it("resolves built-in Lucide icons across naming formats", () => {
      const byPascal = getIconComponent("Folder");
      const byKebab = getIconComponent("folder");
      const byNumbered = getIconComponent("building-2");

      expect(byPascal).toBeDefined();
      expect(byKebab).toBeDefined();
      expect(byNumbered).toBeDefined();
    });

    it("returns null for non-existent icons", () => {
      expect(getIconComponent("NonExistentIconXYZ123")).toBeNull();
      expect(getIconComponent("")).toBeNull();
    });

    it("supports custom SVG icon registration and takes precedence", () => {
      const dummyCustomIcon: CustomIconComponent = () => null;
      registerCustomIcons({
        "custom-company-logo": dummyCustomIcon,
      });

      const resolved = getIconComponent("custom-company-logo");
      expect(resolved).toBe(dummyCustomIcon);
    });
  });

  describe("3. IconPicker Form Exports", () => {
    it("exports IconPicker, FormIconPicker, and ControlledIconPicker", () => {
      expect(IconPicker).toBeDefined();
      expect(FormIconPicker).toBeDefined();
      expect(ControlledIconPicker).toBeDefined();
    });
  });
});
