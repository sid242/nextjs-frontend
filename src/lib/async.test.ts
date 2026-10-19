import { describe, expect, it } from "vitest";

import { runWithConcurrency } from "./async";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("runWithConcurrency", () => {
  it("processes every item and never exceeds the limit", async () => {
    let active = 0;
    let peak = 0;
    const seen: number[] = [];
    await runWithConcurrency([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
      active++;
      peak = Math.max(peak, active);
      await sleep(5);
      seen.push(n);
      active--;
    });
    expect(seen.length).toBe(7);
    expect(peak).toBe(3);
  });

  it("handles empty input and limits larger than the list", async () => {
    await runWithConcurrency([], 3, async () => undefined);
    let count = 0;
    await runWithConcurrency([1, 2], 10, async () => {
      count++;
    });
    expect(count).toBe(2);
  });
});
