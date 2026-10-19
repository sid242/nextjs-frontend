import { describe, expect, it } from "vitest";

import { validateFile } from "./validation";

const file = (type: string, size: number) => ({ name: "a.bin", type, size });

describe("validateFile", () => {
  it("accepts allowed types within the size limit", () => {
    expect(validateFile(file("image/png", 1024))).toBeNull();
    expect(validateFile(file("application/pdf", 10 * 1024 * 1024))).toBeNull();
  });
  it("rejects unsupported types", () => {
    expect(validateFile(file("application/zip", 10))).toMatch(/supported type/);
  });
  it("rejects empty and oversized files", () => {
    expect(validateFile(file("image/png", 0))).toMatch(/empty/);
    expect(validateFile(file("image/png", 10 * 1024 * 1024 + 1))).toMatch(/larger than/);
  });
});
