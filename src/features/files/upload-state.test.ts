import { describe, expect, it } from "vitest";

import { clearFinished, isFinished, patchItem, removeItem, type UploadItem } from "./upload-state";

const item = (id: string, status: UploadItem["status"] = "queued"): UploadItem => ({
  id,
  name: `${id}.png`,
  size: 1,
  progress: 0,
  status,
});

describe("upload queue state", () => {
  it("patches one item and leaves the others untouched", () => {
    const items = [item("a"), item("b")];
    const next = patchItem(items, "a", { progress: 40, status: "uploading" });
    expect(next[0]).toMatchObject({ id: "a", progress: 40, status: "uploading" });
    expect(next[1]).toBe(items[1]);
  });

  it("returns the same array when the id is unknown (no needless re-render)", () => {
    const items = [item("a")];
    expect(patchItem(items, "missing", { progress: 1 })).toBe(items);
  });

  it("removes items and clears only finished ones", () => {
    const items = [
      item("a", "uploading"),
      item("b", "done"),
      item("c", "error"),
      item("d", "cancelled"),
      item("e", "queued"),
    ];
    expect(removeItem(items, "a").length).toBe(4);
    expect(clearFinished(items).map((i) => i.id)).toEqual(["a", "e"]);
  });

  it("knows which statuses are terminal", () => {
    expect(isFinished("done")).toBe(true);
    expect(isFinished("error")).toBe(true);
    expect(isFinished("cancelled")).toBe(true);
    expect(isFinished("uploading")).toBe(false);
    expect(isFinished("confirming")).toBe(false);
  });
});
