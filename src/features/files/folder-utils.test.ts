import { describe, expect, it } from "vitest";

import type { FileFolderRecord } from "@/lib/api/types";

import {
  formatFolderTreeOptions,
  getFolderBreadcrumbTrail,
  getFolderDescendantIds,
  getFolderPath,
  getSubfolders,
} from "./folder-utils";

const mockFolders: FileFolderRecord[] = [
  {
    id: "f-root-1",
    name: "Documents",
    parentId: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "f-root-2",
    name: "Images",
    parentId: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "f-sub-1",
    name: "2026",
    parentId: "f-root-1",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "f-sub-2",
    name: "Q1",
    parentId: "f-sub-1",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "f-sub-3",
    name: "Banners",
    parentId: "f-root-2",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

describe("folder-utils", () => {
  it("computes breadcrumb trail correctly for deep hierarchy", () => {
    const trail = getFolderBreadcrumbTrail("f-sub-2", mockFolders);
    expect(trail.map((f) => f.name)).toEqual(["Documents", "2026", "Q1"]);
    expect(trail.map((f) => f.id)).toEqual(["f-root-1", "f-sub-1", "f-sub-2"]);
  });

  it("returns empty breadcrumb for null or missing activeFolderId", () => {
    expect(getFolderBreadcrumbTrail(null, mockFolders)).toEqual([]);
    expect(getFolderBreadcrumbTrail("unknown", mockFolders)).toEqual([]);
  });

  it("computes human-readable folder path string", () => {
    expect(getFolderPath("f-sub-2", mockFolders)).toBe("Documents / 2026 / Q1");
    expect(getFolderPath("f-root-1", mockFolders)).toBe("Documents");
    expect(getFolderPath("unknown", mockFolders)).toBe("Root");
  });

  it("filters immediate subfolders", () => {
    const rootSubfolders = getSubfolders(null, mockFolders);
    expect(rootSubfolders.map((f) => f.name)).toEqual(["Documents", "Images"]);

    const docSubfolders = getSubfolders("f-root-1", mockFolders);
    expect(docSubfolders.map((f) => f.name)).toEqual(["2026"]);

    const yearSubfolders = getSubfolders("f-sub-1", mockFolders);
    expect(yearSubfolders.map((f) => f.name)).toEqual(["Q1"]);

    const leafSubfolders = getSubfolders("f-sub-2", mockFolders);
    expect(leafSubfolders).toEqual([]);
  });

  it("computes recursive descendant IDs", () => {
    const descendantsOfRoot1 = getFolderDescendantIds("f-root-1", mockFolders);
    expect(descendantsOfRoot1.has("f-sub-1")).toBe(true);
    expect(descendantsOfRoot1.has("f-sub-2")).toBe(true);
    expect(descendantsOfRoot1.has("f-root-2")).toBe(false);
    expect(descendantsOfRoot1.has("f-sub-3")).toBe(false);

    const descendantsOfSub1 = getFolderDescendantIds("f-sub-1", mockFolders);
    expect(descendantsOfSub1.has("f-sub-2")).toBe(true);
    expect(descendantsOfSub1.has("f-sub-1")).toBe(false);
  });

  it("formats folder tree options with depth and path", () => {
    const options = formatFolderTreeOptions(mockFolders);
    expect(options).toEqual([
      { id: "f-root-1", name: "Documents", path: "Documents", depth: 0 },
      { id: "f-sub-1", name: "2026", path: "Documents / 2026", depth: 1 },
      { id: "f-sub-2", name: "Q1", path: "Documents / 2026 / Q1", depth: 2 },
      { id: "f-root-2", name: "Images", path: "Images", depth: 0 },
      { id: "f-sub-3", name: "Banners", path: "Images / Banners", depth: 1 },
    ]);
  });

  it("formats folder tree options excluding specific IDs", () => {
    const exclude = new Set(["f-root-1", "f-sub-1", "f-sub-2"]);
    const options = formatFolderTreeOptions(mockFolders, exclude);
    expect(options).toEqual([
      { id: "f-root-2", name: "Images", path: "Images", depth: 0 },
      { id: "f-sub-3", name: "Banners", path: "Images / Banners", depth: 1 },
    ]);
  });
});
