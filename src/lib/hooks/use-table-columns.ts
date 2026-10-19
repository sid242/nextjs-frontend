import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

export interface TableColumnDef<TId extends string = string> {
  /** Unique identifier for the column */
  id: TId;
  /** Human-readable label for column config UI */
  label: string;
  /** Whether this column can be hidden. Defaults to true. If false, it cannot be hidden */
  canHide?: boolean;
  /** Initial visibility. Defaults to true */
  defaultVisible?: boolean;
}

export interface ColumnItemState<TId extends string = string> {
  id: TId;
  label: string;
  visible: boolean;
  canHide: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export interface UseTableColumnsOptions<TId extends string = string> {
  /** Array of column definitions */
  columns: TableColumnDef<TId>[];
  /** Optional unique table ID for localStorage persistence (e.g. "files-table") */
  tableId?: string;
  /** Optional callback when column order changes */
  onColumnOrderChange?: (order: TId[]) => void;
  /** Optional callback when visibility changes */
  onColumnVisibilityChange?: (visibility: Record<TId, boolean>) => void;
}

export interface UseTableColumnsReturn<TId extends string = string> {
  /** Original column definitions */
  columns: TableColumnDef<TId>[];
  /** Current column order (all IDs, visible and hidden) */
  columnOrder: TId[];
  /** Visibility map by column ID */
  visibleColumns: Record<TId, boolean>;
  /** Ordered list of currently visible column IDs */
  orderedVisibleColumns: TId[];
  /** Ordered list of column item states for UI rendering */
  columnItems: ColumnItemState<TId>[];
  /** Whether a specific column is currently visible */
  isColumnVisible: (id: TId) => boolean;
  /** Toggle visibility of a column */
  toggleColumn: (id: TId) => void;
  /** Explicitly set visibility of a column */
  setColumnVisibility: (id: TId, visible: boolean) => void;
  /** Move a column up or down in order */
  moveColumn: (id: TId, direction: "up" | "down") => void;
  /** Reorder a column by indices */
  reorderColumns: (startIndex: number, endIndex: number) => void;
  /** Set complete custom column order */
  setColumnOrder: (newOrder: TId[]) => void;
  /** Reset order and visibility to defaults */
  resetColumns: () => void;
  /** True if order or visibility differs from defaults */
  isCustomized: boolean;
  /** True once client-side preferences from localStorage have resolved */
  isLoaded: boolean;
}

export interface TableColumnsState<TId extends string> {
  order: TId[];
  visible: Record<TId, boolean>;
}

export function moveColumnInOrder<TId extends string>(
  order: TId[],
  id: TId,
  direction: "up" | "down",
): TId[] {
  const idx = order?.indexOf(id) ?? -1;
  if (idx === -1) return order ?? [];
  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= (order?.length ?? 0)) return order;

  const nextOrder = [...(order ?? [])];
  const item = nextOrder[idx];
  if (item === undefined) return order;

  nextOrder.splice(idx, 1);
  nextOrder.splice(targetIdx, 0, item);
  return nextOrder;
}

export function reorderColumnsInOrder<TId extends string>(
  order: TId[],
  startIndex: number,
  endIndex: number,
): TId[] {
  const orderLen = order?.length ?? 0;
  if (
    startIndex < 0 ||
    startIndex >= orderLen ||
    endIndex < 0 ||
    endIndex >= orderLen ||
    startIndex === endIndex
  ) {
    return order ?? [];
  }

  const nextOrder = [...(order ?? [])];
  const [removed] = nextOrder.splice(startIndex, 1);
  if (removed === undefined) return order;

  nextOrder.splice(endIndex, 0, removed);
  return nextOrder;
}

export function reconcileTableColumnsState<TId extends string>(
  storedOrder: string[] | undefined,
  storedVisibility: Record<string, boolean> | undefined,
  columns: TableColumnDef<TId>[],
): TableColumnsState<TId> {
  const columnMap = new Map(columns?.map((c) => [c.id, c]) ?? []);

  // Filter out removed columns, then append any newly introduced columns
  const validStored = (storedOrder ?? []).filter((id) => columnMap.has(id as TId)) as TId[];
  const newCols = (columns ?? []).filter((c) => !validStored.includes(c.id)).map((c) => c.id);
  const reconciledOrder = [...validStored, ...newCols];

  // Reconcile visibility
  const reconciledVisible = {} as Record<TId, boolean>;
  for (const col of columns ?? []) {
    if (col?.canHide === false) {
      reconciledVisible[col.id] = true;
    } else if (storedVisibility && typeof storedVisibility[col.id] === "boolean") {
      reconciledVisible[col.id] = storedVisibility[col.id] ?? true;
    } else {
      reconciledVisible[col.id] = col?.defaultVisible ?? true;
    }
  }

  // Guard: Ensure at least one column is visible
  const hasVisible = Object.values(reconciledVisible).some(Boolean);
  if (!hasVisible && (columns?.length ?? 0) > 0) {
    const firstCol = columns?.[0];
    if (firstCol?.id) {
      reconciledVisible[firstCol.id] = true;
    }
  }

  return { order: reconciledOrder, visible: reconciledVisible };
}

// In-tab pub-sub listener set for storage sync
const storageListeners = new Set<() => void>();
function notifyStorageListeners() {
  for (const listener of storageListeners) {
    listener();
  }
}

/**
 * Hook for managing table column visibility, ordering, reordering, and localStorage persistence.
 * Uses useSyncExternalStore for hydration-safe, tear-free external storage synchronization.
 */
export function useTableColumns<TId extends string = string>({
  columns,
  tableId,
  onColumnOrderChange,
  onColumnVisibilityChange,
}: UseTableColumnsOptions<TId>): UseTableColumnsReturn<TId> {
  const defaultOrder = useMemo(() => columns?.map((c) => c.id) ?? [], [columns]);
  const defaultVisibility = useMemo(() => {
    return (columns ?? []).reduce<Record<TId, boolean>>(
      (acc, col) => {
        acc[col.id] = col.defaultVisible ?? true;
        return acc;
      },
      {} as Record<TId, boolean>,
    );
  }, [columns]);

  const storageKey = tableId ? `table_columns:${tableId}` : null;

  // Subscribe to storage changes (both cross-tab and in-tab)
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!storageKey || typeof window === "undefined") {
        return () => {};
      }
      storageListeners.add(callback);
      const handleStorage = (e: StorageEvent) => {
        if (e.key === storageKey) {
          callback();
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => {
        storageListeners.delete(callback);
        window.removeEventListener("storage", handleStorage);
      };
    },
    [storageKey],
  );

  const getSnapshot = useCallback(() => {
    if (!storageKey || typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  }, [storageKey]);

  const getServerSnapshot = useCallback(() => null, []);

  const storedRaw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Reconciled state from localStorage if tableId is provided
  const storedState = useMemo<TableColumnsState<TId> | null>(() => {
    if (!storedRaw) return null;
    try {
      const parsed = JSON.parse(storedRaw) as {
        order?: string[];
        visible?: Record<string, boolean>;
      };
      if (parsed && typeof parsed === "object") {
        return reconcileTableColumnsState(parsed.order, parsed.visible, columns);
      }
    } catch {
      return null;
    }
    return null;
  }, [storedRaw, columns]);

  // Fallback in-memory state when tableId is not provided
  const [inMemoryState, setInMemoryState] = useState<TableColumnsState<TId>>(() => ({
    order: defaultOrder,
    visible: defaultVisibility,
  }));

  const currentState: TableColumnsState<TId> = useMemo(() => {
    if (storageKey) {
      return storedState ?? { order: defaultOrder, visible: defaultVisibility };
    }
    return inMemoryState;
  }, [storageKey, storedState, inMemoryState, defaultOrder, defaultVisibility]);

  const persistState = useCallback(
    (order: TId[], visible: Record<TId, boolean>) => {
      if (storageKey && typeof window !== "undefined") {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify({ order, visible }));
          notifyStorageListeners();
        } catch (err) {
          console.warn(
            `[useTableColumns] Failed to persist preferences for table "${tableId}":`,
            err,
          );
        }
      } else {
        setInMemoryState({ order, visible });
      }
    },
    [storageKey, tableId],
  );

  const toggleColumn = useCallback(
    (id: TId) => {
      const col = columns?.find((c) => c.id === id);
      if (col?.canHide === false) return;

      const currentVal = currentState.visible?.[id] ?? true;
      if (currentVal) {
        const visibleCount = (currentState.order ?? []).filter(
          (colId) => currentState.visible?.[colId] !== false,
        ).length;
        if (visibleCount <= 1) return;
      }

      const nextVisible = { ...currentState.visible, [id]: !currentVal };
      persistState(currentState.order, nextVisible);
      onColumnVisibilityChange?.(nextVisible);
    },
    [columns, currentState, persistState, onColumnVisibilityChange],
  );

  const setColumnVisibility = useCallback(
    (id: TId, visible: boolean) => {
      const col = columns?.find((c) => c.id === id);
      if (col?.canHide === false && !visible) return;

      const currentVal = currentState.visible?.[id] ?? true;
      if (currentVal === visible) return;

      if (!visible) {
        const visibleCount = (currentState.order ?? []).filter(
          (colId) => currentState.visible?.[colId] !== false,
        ).length;
        if (visibleCount <= 1) return;
      }

      const nextVisible = { ...currentState.visible, [id]: visible };
      persistState(currentState.order, nextVisible);
      onColumnVisibilityChange?.(nextVisible);
    },
    [columns, currentState, persistState, onColumnVisibilityChange],
  );

  const moveColumn = useCallback(
    (id: TId, direction: "up" | "down") => {
      const nextOrder = moveColumnInOrder(currentState.order, id, direction);
      if (nextOrder === currentState.order) return;

      persistState(nextOrder, currentState.visible);
      onColumnOrderChange?.(nextOrder);
    },
    [currentState, persistState, onColumnOrderChange],
  );

  const reorderColumns = useCallback(
    (startIndex: number, endIndex: number) => {
      const nextOrder = reorderColumnsInOrder(currentState.order, startIndex, endIndex);
      if (nextOrder === currentState.order) return;

      persistState(nextOrder, currentState.visible);
      onColumnOrderChange?.(nextOrder);
    },
    [currentState, persistState, onColumnOrderChange],
  );

  const setColumnOrder = useCallback(
    (newOrder: TId[]) => {
      const validOrder = (newOrder ?? []).filter((id) => columns?.some((c) => c.id === id));
      for (const c of columns ?? []) {
        if (!validOrder.includes(c.id)) {
          validOrder.push(c.id);
        }
      }

      persistState(validOrder, currentState.visible);
      onColumnOrderChange?.(validOrder);
    },
    [columns, currentState.visible, persistState, onColumnOrderChange],
  );

  const resetColumns = useCallback(() => {
    if (storageKey && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(storageKey);
        notifyStorageListeners();
      } catch (err) {
        console.warn(`[useTableColumns] Failed to clear preferences for table "${tableId}":`, err);
      }
    } else {
      setInMemoryState({ order: defaultOrder, visible: defaultVisibility });
    }

    onColumnOrderChange?.(defaultOrder);
    onColumnVisibilityChange?.(defaultVisibility);
  }, [
    storageKey,
    tableId,
    defaultOrder,
    defaultVisibility,
    onColumnOrderChange,
    onColumnVisibilityChange,
  ]);

  const isCustomized = useMemo(() => {
    const isOrderChanged = (currentState.order ?? []).some((id, idx) => id !== defaultOrder?.[idx]);
    if (isOrderChanged) return true;

    return (columns ?? []).some((col) => {
      const current = currentState.visible?.[col.id] ?? true;
      const initial = defaultVisibility?.[col.id] ?? true;
      return current !== initial;
    });
  }, [columns, currentState.order, currentState.visible, defaultOrder, defaultVisibility]);

  const orderedVisibleColumns = useMemo(() => {
    return (currentState.order ?? []).filter((id) => currentState.visible?.[id] !== false);
  }, [currentState.order, currentState.visible]);

  const columnItems = useMemo<ColumnItemState<TId>[]>(() => {
    const colMap = new Map((columns ?? []).map((c) => [c.id, c]));
    const total = currentState.order?.length ?? 0;
    return (currentState.order ?? []).map((id, index) => {
      const def = colMap.get(id);
      return {
        id,
        label: def?.label ?? id,
        visible: currentState.visible?.[id] !== false,
        canHide: def?.canHide ?? true,
        isFirst: index === 0,
        isLast: index === total - 1,
      };
    });
  }, [columns, currentState.order, currentState.visible]);

  const isColumnVisible = useCallback(
    (id: TId) => {
      return currentState.visible?.[id] !== false;
    },
    [currentState.visible],
  );

  return {
    columns,
    columnOrder: currentState.order,
    visibleColumns: currentState.visible,
    orderedVisibleColumns,
    columnItems,
    isColumnVisible,
    toggleColumn,
    setColumnVisibility,
    moveColumn,
    reorderColumns,
    setColumnOrder,
    resetColumns,
    isCustomized,
    isLoaded: typeof window !== "undefined",
  };
}
