import { describe, expect, it } from "vitest";

import { formatCountdownTime } from "./use-countdown";

describe("formatCountdownTime", () => {
  it("formats two-digit seconds under one minute", () => {
    expect(formatCountdownTime(0)).toBe("00:00");
    expect(formatCountdownTime(9)).toBe("00:09");
    expect(formatCountdownTime(45)).toBe("00:45");
    expect(formatCountdownTime(59)).toBe("00:59");
  });

  it("formats minutes and seconds", () => {
    expect(formatCountdownTime(60)).toBe("01:00");
    expect(formatCountdownTime(90)).toBe("01:30");
    expect(formatCountdownTime(599)).toBe("09:59");
    expect(formatCountdownTime(3599)).toBe("59:59");
  });

  it("formats hours, minutes, and seconds when exceeding one hour", () => {
    expect(formatCountdownTime(3600)).toBe("01:00:00");
    expect(formatCountdownTime(3665)).toBe("01:01:05");
    expect(formatCountdownTime(7325)).toBe("02:02:05");
  });

  it("handles negative numbers safely without crashing", () => {
    expect(formatCountdownTime(-10)).toBe("00:00");
  });
});
