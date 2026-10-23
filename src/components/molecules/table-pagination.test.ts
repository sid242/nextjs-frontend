import { describe, expect, it } from "vitest";

import { getPageNumbers } from "./table-pagination";

describe("getPageNumbers", () => {
  it("returns all pages when totalPages <= 7", () => {
    expect(getPageNumbers(1, 1)).toEqual([1]);
    expect(getPageNumbers(1, 3)).toEqual([1, 2, 3]);
    expect(getPageNumbers(2, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageNumbers(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("handles near start when totalPages > 7", () => {
    // Current page 1 of 8 -> 1, 2, 3, 4, 5, ..., 8
    expect(getPageNumbers(1, 8)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 8]);
    expect(getPageNumbers(2, 8)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 8]);
    expect(getPageNumbers(3, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 10]);
    expect(getPageNumbers(4, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 10]);
  });

  it("handles near end when totalPages > 7", () => {
    // Current page near end (>= totalPages - 3)
    // For 8 pages: 8 - 3 = 5
    expect(getPageNumbers(5, 8)).toEqual([1, "ellipsis-start", 4, 5, 6, 7, 8]);
    expect(getPageNumbers(7, 8)).toEqual([1, "ellipsis-start", 4, 5, 6, 7, 8]);
    expect(getPageNumbers(8, 8)).toEqual([1, "ellipsis-start", 4, 5, 6, 7, 8]);
    // For 10 pages: 10 - 3 = 7
    expect(getPageNumbers(7, 10)).toEqual([1, "ellipsis-start", 6, 7, 8, 9, 10]);
    expect(getPageNumbers(10, 10)).toEqual([1, "ellipsis-start", 6, 7, 8, 9, 10]);
  });

  it("handles middle pages with ellipses on both sides when totalPages > 7", () => {
    // For 10 pages: currentPage = 5 or 6
    expect(getPageNumbers(5, 10)).toEqual([1, "ellipsis-start", 4, 5, 6, "ellipsis-end", 10]);
    expect(getPageNumbers(6, 10)).toEqual([1, "ellipsis-start", 5, 6, 7, "ellipsis-end", 10]);
  });
});
