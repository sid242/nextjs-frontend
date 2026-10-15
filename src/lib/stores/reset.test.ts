import { describe, expect, it } from "vitest";
import { registerStoreReset, resetAllStores } from "./reset";

describe("store reset registry", () => {
  it("calls every registered resetter and supports unregistering", () => {
    let a = 0;
    let b = 0;
    const offA = registerStoreReset(() => a++);
    registerStoreReset(() => b++);
    resetAllStores();
    offA();
    resetAllStores();
    expect(a).toBe(1);
    expect(b).toBe(2);
  });
});
