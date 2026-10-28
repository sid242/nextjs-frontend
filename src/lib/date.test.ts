import { describe, expect, it } from "vitest";

import {
  DATE_FORMATS,
  diffFromNow,
  formatDate,
  formatDateOnly,
  formatDateTime,
  formatRelativeTime,
  formatTimeOnly,
  isValidDate,
  toDayjs,
} from "./date";

describe("date utilities with dayjs", () => {
  const sampleIso = "2026-10-28T14:30:00.000Z";
  const sampleDate = new Date("2026-10-28T14:30:00.000Z");

  describe("formatDate & formatDateTime", () => {
    it("formats dates using default 'DD MMM YYYY hh:mm A' format", () => {
      const formatted = formatDate(sampleDate);
      expect(formatted).toMatch(/^\d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2} (AM|PM)$/);
      expect(formatted).toContain("2026");
      expect(formatted).toContain("Oct");
    });

    it("handles null, undefined, empty string, and invalid dates gracefully", () => {
      expect(formatDate(null)).toBe("—");
      expect(formatDate(undefined)).toBe("—");
      expect(formatDate("")).toBe("—");
      expect(formatDate("invalid-date-string")).toBe("—");
      expect(formatDate(null, DATE_FORMATS.DEFAULT, "N/A")).toBe("N/A");
    });

    it("supports custom date format patterns", () => {
      expect(formatDate("2026-10-28T00:00:00.000Z", "YYYY/MM/DD")).toBe("2026/10/28");
    });

    it("formatDateTime behaves identically to formatDate", () => {
      expect(formatDateTime(sampleDate)).toBe(formatDate(sampleDate));
    });
  });

  describe("formatDateOnly", () => {
    it("formats only date as 'DD MMM YYYY'", () => {
      const formatted = formatDateOnly(sampleDate);
      expect(formatted).toMatch(/^\d{2} [A-Z][a-z]{2} 2026$/);
      expect(formatted).toContain("Oct");
    });

    it("returns fallback for invalid input", () => {
      expect(formatDateOnly(null)).toBe("—");
    });
  });

  describe("formatTimeOnly", () => {
    it("formats only time as 'hh:mm A'", () => {
      const formatted = formatTimeOnly(sampleDate);
      expect(formatted).toMatch(/^\d{2}:\d{2} (AM|PM)$/);
    });

    it("returns fallback for invalid input", () => {
      expect(formatTimeOnly(null)).toBe("—");
    });
  });

  describe("isValidDate & toDayjs", () => {
    it("validates valid and invalid dates correctly", () => {
      expect(isValidDate(sampleIso)).toBe(true);
      expect(isValidDate(sampleDate)).toBe(true);
      expect(isValidDate(Date.now())).toBe(true);
      expect(isValidDate("invalid")).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate("")).toBe(false);
    });

    it("toDayjs returns valid Dayjs instance or null", () => {
      expect(toDayjs(sampleDate)).not.toBeNull();
      expect(toDayjs(null)).toBeNull();
      expect(toDayjs("invalid")).toBeNull();
    });
  });

  describe("formatRelativeTime & diffFromNow", () => {
    it("returns human readable relative time", () => {
      const past = new Date(Date.now() - 3600 * 1000 * 2);
      expect(formatRelativeTime(past)).toContain("ago");
    });

    it("returns fallback on relative time for invalid input", () => {
      expect(formatRelativeTime(null)).toBe("—");
    });

    it("calculates diffFromNow", () => {
      const future = new Date(Date.now() + 10000);
      const diff = diffFromNow(future, "seconds");
      expect(typeof diff).toBe("number");
      expect(diff).toBeGreaterThan(0);
      expect(diffFromNow(null)).toBeNull();
    });
  });
});
