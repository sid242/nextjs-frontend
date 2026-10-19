import { describe, expect, it } from "vitest";

import {
  moveColumnInOrder,
  reconcileTableColumnsState,
  reorderColumnsInOrder,
  type TableColumnDef,
} from "./use-table-columns";

describe("useTableColumns helpers", () => {
  describe("moveColumnInOrder", () => {
    const initialOrder = ["colA", "colB", "colC", "colD"];

    it("moves a column up one position", () => {
      const result = moveColumnInOrder(initialOrder, "colC", "up");
      expect(result).toEqual(["colA", "colC", "colB", "colD"]);
    });

    it("moves a column down one position", () => {
      const result = moveColumnInOrder(initialOrder, "colB", "down");
      expect(result).toEqual(["colA", "colC", "colB", "colD"]);
    });

    it("does not move the first column further up", () => {
      const result = moveColumnInOrder(initialOrder, "colA", "up");
      expect(result).toEqual(initialOrder);
    });

    it("does not move the last column further down", () => {
      const result = moveColumnInOrder(initialOrder, "colD", "down");
      expect(result).toEqual(initialOrder);
    });

    it("safely handles non-existent column ids", () => {
      const result = moveColumnInOrder(initialOrder, "nonExistent", "up");
      expect(result).toEqual(initialOrder);
    });

    it("safely handles empty arrays", () => {
      const result = moveColumnInOrder([], "colA", "up");
      expect(result).toEqual([]);
    });
  });

  describe("reorderColumnsInOrder", () => {
    const initialOrder = ["colA", "colB", "colC", "colD"];

    it("reorders an item to a later index", () => {
      const result = reorderColumnsInOrder(initialOrder, 0, 2);
      expect(result).toEqual(["colB", "colC", "colA", "colD"]);
    });

    it("reorders an item to an earlier index", () => {
      const result = reorderColumnsInOrder(initialOrder, 3, 1);
      expect(result).toEqual(["colA", "colD", "colB", "colC"]);
    });

    it("returns unchanged when startIndex equals endIndex", () => {
      const result = reorderColumnsInOrder(initialOrder, 2, 2);
      expect(result).toEqual(initialOrder);
    });

    it("returns unchanged on out-of-bounds start or end indices", () => {
      expect(reorderColumnsInOrder(initialOrder, -1, 2)).toEqual(initialOrder);
      expect(reorderColumnsInOrder(initialOrder, 0, 10)).toEqual(initialOrder);
    });
  });

  describe("reconcileTableColumnsState", () => {
    const columns: TableColumnDef[] = [
      { id: "id", label: "ID", canHide: false, defaultVisible: true },
      { id: "name", label: "Name", canHide: true, defaultVisible: true },
      { id: "status", label: "Status", canHide: true, defaultVisible: true },
      { id: "notes", label: "Notes", canHide: true, defaultVisible: false },
    ];

    it("returns initial defaults when stored preferences are undefined", () => {
      const state = reconcileTableColumnsState(undefined, undefined, columns);
      expect(state.order).toEqual(["id", "name", "status", "notes"]);
      expect(state.visible).toEqual({
        id: true,
        name: true,
        status: true,
        notes: false,
      });
    });

    it("filters out stale columns and appends newly added columns in code", () => {
      const storedOrder = ["status", "deprecatedColumn", "id"];
      const storedVisibility = { status: true, deprecatedColumn: true, id: true };

      const state = reconcileTableColumnsState(storedOrder, storedVisibility, columns);

      // deprecatedColumn removed, status and id preserved in stored order, name & notes appended
      expect(state.order).toEqual(["status", "id", "name", "notes"]);
      expect(state.visible.id).toBe(true);
      expect(state.visible.status).toBe(true);
      expect(state.visible.name).toBe(true); // defaultVisible
      expect(state.visible.notes).toBe(false); // defaultVisible
    });

    it("enforces canHide: false columns remain visible even if stored as false", () => {
      const storedVisibility = { id: false, name: true, status: true };

      const state = reconcileTableColumnsState(undefined, storedVisibility, columns);
      expect(state.visible.id).toBe(true);
    });

    it("preserves user visibility choices for hideable columns", () => {
      const storedVisibility = { name: false, status: true, notes: true };

      const state = reconcileTableColumnsState(undefined, storedVisibility, columns);
      expect(state.visible.name).toBe(false);
      expect(state.visible.status).toBe(true);
      expect(state.visible.notes).toBe(true);
    });

    it("ensures at least one column remains visible if all were turned off", () => {
      const hideableCols: TableColumnDef[] = [
        { id: "col1", label: "Col 1", canHide: true },
        { id: "col2", label: "Col 2", canHide: true },
      ];
      const allOff = { col1: false, col2: false };

      const state = reconcileTableColumnsState(undefined, allOff, hideableCols);
      const visibleValues = Object.values(state.visible);
      expect(visibleValues.some(Boolean)).toBe(true);
      expect(state.visible.col1).toBe(true);
    });
  });
});
