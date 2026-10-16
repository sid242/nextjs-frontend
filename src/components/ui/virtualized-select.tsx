"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type MutableRefObject,
  type ReactNode,
  type Ref,
  type UIEvent,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface SelectOption<T = string | number> {
  label: string;
  value: T;
  disabled?: boolean;
  description?: string;
  icon?: ReactNode;
  [key: string]: unknown;
}

export type SelectValue<T = string | number> =
  SelectOption<T> | SelectOption<T>[] | T | T[] | null | undefined;

export interface VirtualizedSelectProps<T = string | number> {
  options: SelectOption<T>[];
  value?: SelectValue<T>;
  defaultValue?: SelectValue<T>;
  /**
   * Emits the selected option object(s) containing both label and value.
   * Preserves human-readable labels regardless of API pagination.
   */
  onValueChange?: (selected: SelectOption<T> | SelectOption<T>[] | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  isSearchable?: boolean;
  isClearable?: boolean;
  isMultiSelect?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** Whether the upstream API has additional paginated pages to fetch */
  hasMore?: boolean;
  /** Whether an asynchronous page fetch is currently in progress */
  isLoadingMore?: boolean;
  /** Callback triggered when scrolling near the bottom of the virtualized list */
  onLoadMore?: () => void;
  /** Callback triggered when the search query changes (for server-side search) */
  onSearchChange?: (query: string) => void;
  /** Ant Design style max tag count. Pass 'responsive' to dynamically hide tags into a +N badge */
  maxTagCount?: number | "responsive";
  /** Optional label suffix for the overflow badge (e.g. 'item', 'selected') */
  maxTagLabel?: string;
  /** Show tooltip with hidden options list when hovering over +N badge */
  showMaxTagTooltip?: boolean;
  /** Show Select all / Deselect all button in multi-select mode */
  showSelectAll?: boolean;
  className?: string;
  popoverClassName?: string;
  error?: boolean;
  id?: string;
  name?: string;
  maxHeight?: number;
  itemHeight?: number;
  ref?: Ref<HTMLDivElement>;
}

export function VirtualizedSelect<T extends string | number = string>({
  options = [],
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select an option…",
  searchPlaceholder = "Search options…",
  isSearchable = true,
  isClearable = true,
  isMultiSelect = false,
  disabled = false,
  loading = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onSearchChange,
  maxTagCount = "responsive",
  maxTagLabel,
  showMaxTagTooltip = true,
  showSelectAll = false,
  className,
  popoverClassName,
  error = false,
  id,
  name,
  maxHeight = 240,
  itemHeight = 36,
  ref,
}: VirtualizedSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<SelectValue<T>>(defaultValue);
  const [searchQuery, setSearchQuery] = useState("");

  const internalContainerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const assignContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      (internalContainerRef as MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref && "current" in ref) {
        (ref as MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [ref],
  );

  const activeValue = value !== undefined ? value : internalValue;

  // Resolve selected options array from activeValue
  const selectedOptions = useMemo<SelectOption<T>[]>(() => {
    if (!activeValue) return [];

    const valueArray = Array.isArray(activeValue) ? activeValue : [activeValue];

    return (
      valueArray?.map((val) => {
        if (typeof val === "object" && val !== null && "value" in val && "label" in val) {
          return val as SelectOption<T>;
        }

        const match = options?.find((opt) => opt?.value === val);
        if (match) return match;

        return { label: String(val), value: val as T };
      }) ?? []
    );
  }, [activeValue, options]);

  // Ant Design style responsive tag calculation
  const [visibleCount, setVisibleCount] = useState<number>(
    typeof maxTagCount === "number" ? maxTagCount : (selectedOptions?.length ?? 0),
  );

  useLayoutEffect(() => {
    if (typeof maxTagCount === "number") {
      setVisibleCount(maxTagCount);
      return;
    }

    if (maxTagCount !== "responsive" || !isMultiSelect || (selectedOptions?.length ?? 0) === 0) {
      setVisibleCount(selectedOptions?.length ?? 0);
      return;
    }

    const compute = () => {
      const trigger = triggerRef?.current;
      const measure = measureRef?.current;
      if (!trigger || !measure) return;

      // Available width: trigger width minus icons/actions and minimum input width
      const availableWidth = (trigger?.offsetWidth ?? 200) - 85;
      const tagEls = Array.from(measure?.querySelectorAll<HTMLElement>(".tag-measure-item") ?? []);
      const badgeEl = measure?.querySelector<HTMLElement>(".badge-measure");
      const badgeWidth = badgeEl?.offsetWidth ?? 36;

      let usedWidth = 0;
      let count = 0;

      for (let i = 0; i < (tagEls?.length ?? 0); i++) {
        const el = tagEls?.[i];
        if (!el) break;
        const tagWidth = (el?.offsetWidth ?? 0) + 4;
        const isLast = i === (tagEls?.length ?? 0) - 1;
        const spaceNeeded = usedWidth + tagWidth + (isLast ? 0 : badgeWidth + 6);

        if (spaceNeeded <= availableWidth) {
          usedWidth += tagWidth;
          count++;
        } else {
          break;
        }
      }

      setVisibleCount(Math.max(1, count));
    };

    const ro = new ResizeObserver(() => requestAnimationFrame(compute));
    if (triggerRef?.current) ro.observe(triggerRef.current);
    compute();
    return () => ro?.disconnect();
  }, [selectedOptions?.length, isMultiSelect, maxTagCount]);

  // Filter options based on local search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery?.trim()) return options ?? [];
    const lower = searchQuery?.toLowerCase();
    return (
      (options ?? [])?.filter(
        (opt) =>
          opt?.label?.toLowerCase()?.includes(lower) ||
          (opt?.description && opt?.description?.toLowerCase()?.includes(lower)),
      ) ?? []
    );
  }, [options, searchQuery]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        internalContainerRef.current &&
        !internalContainerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick as unknown as EventListener);
    document.addEventListener("keydown", handleEscape as unknown as EventListener);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick as unknown as EventListener);
      document.removeEventListener("keydown", handleEscape as unknown as EventListener);
    };
  }, [isOpen]);

  // TanStack Virtualizer
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: filteredOptions?.length ?? 0,
    getScrollElement: () => scrollParentRef?.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });

  // Handle infinite scroll triggering near the bottom
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop = 0, scrollHeight = 0, clientHeight = 0 } = e?.currentTarget ?? {};
    if (
      hasMore &&
      !isLoadingMore &&
      onLoadMore &&
      scrollHeight - scrollTop - clientHeight < itemHeight * 2
    ) {
      onLoadMore();
    }
  };

  const handleSelect = (option: SelectOption<T>) => {
    if (option?.disabled) return;

    if (isMultiSelect) {
      const exists = selectedOptions?.some((item) => item?.value === option?.value);
      const updated = exists
        ? (selectedOptions?.filter((item) => item?.value !== option?.value) ?? [])
        : [...selectedOptions, option];

      setInternalValue(updated);
      onValueChange?.(updated);
    } else {
      setInternalValue(option);
      onValueChange?.(option);
      setIsOpen(false);
    }
  };

  const handleRemoveOption = (e: MouseEvent, option: SelectOption<T>) => {
    e?.stopPropagation?.();
    const updated = selectedOptions?.filter((item) => item?.value !== option?.value) ?? [];
    setInternalValue(updated);
    onValueChange?.(updated);
  };

  const handleClear = (e: MouseEvent) => {
    e?.stopPropagation?.();
    const empty = isMultiSelect ? [] : null;
    setInternalValue(empty);
    onValueChange?.(empty);
  };

  const handleSearchInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e?.target?.value ?? "";
    setSearchQuery(query);
    onSearchChange?.(query);
    if (!isOpen) setIsOpen(true);
  };

  const isSelected = (opt: SelectOption<T>) =>
    selectedOptions?.some((item) => item?.value === opt?.value);

  const allSelected =
    (filteredOptions?.length ?? 0) > 0 && filteredOptions?.every((opt) => isSelected(opt));

  const handleToggleAll = (e: MouseEvent) => {
    e?.stopPropagation?.();
    if (allSelected) {
      // Deselect all visible
      const updated =
        selectedOptions?.filter(
          (sel) => !filteredOptions?.some((opt) => opt?.value === sel?.value),
        ) ?? [];
      setInternalValue(updated);
      onValueChange?.(updated);
    } else {
      // Select all visible
      const toAdd =
        filteredOptions?.filter(
          (opt) => !selectedOptions?.some((sel) => sel?.value === opt?.value),
        ) ?? [];
      const updated = [...selectedOptions, ...toAdd];
      setInternalValue(updated);
      onValueChange?.(updated);
    }
  };

  const visibleOptions = selectedOptions?.slice(0, visibleCount) ?? [];
  const hiddenOptions = selectedOptions?.slice(visibleCount) ?? [];

  return (
    <div ref={assignContainerRef} className="relative w-full">
      {/* Hidden measurement div for Ant Design style responsive tag calculation */}
      {isMultiSelect && maxTagCount === "responsive" && (
        <div
          ref={measureRef}
          aria-hidden="true"
          className="pointer-events-none invisible absolute flex gap-1 whitespace-nowrap"
          style={{ left: -9999, top: -9999 }}
        >
          {selectedOptions?.map((opt) => (
            <div
              key={String(opt?.value)}
              className="tag-measure-item flex h-5 items-center gap-1 rounded px-1.5 text-xs font-medium"
            >
              {opt?.icon}
              {opt?.label}
            </div>
          ))}
          <div className="badge-measure rounded border px-1.5 py-0.5 text-xs font-semibold">
            +{selectedOptions?.length ?? 0}
          </div>
        </div>
      )}

      {/* Main Trigger Container */}
      <div
        ref={triggerRef}
        id={id}
        data-invalid={error ? true : undefined}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            searchInputRef.current?.focus();
          }
        }}
        className={cn(
          "border-input placeholder:text-muted-foreground flex min-h-9 w-full cursor-pointer items-center justify-between rounded-md border bg-transparent px-2.5 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none",
          "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
          disabled && "cursor-not-allowed opacity-50",
          error && "border-destructive focus-within:ring-destructive/20",
          className,
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {/* Multi-Select Tags */}
          {isMultiSelect ? (
            <Fragment>
              {visibleOptions?.map((opt) => (
                <span
                  key={String(opt?.value)}
                  className="bg-muted text-foreground inline-flex h-6 items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium"
                >
                  {opt?.icon}
                  <span className="max-w-[120px] truncate">{opt?.label}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveOption(e, opt)}
                      className="text-muted-foreground hover:text-foreground ml-0.5 rounded-xs"
                      aria-label={`Remove ${opt?.label ?? ""}`}
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </span>
              ))}

              {/* Overflow +N Badge with Tooltip */}
              {(hiddenOptions?.length ?? 0) > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="bg-muted text-muted-foreground hover:text-foreground inline-flex h-6 shrink-0 cursor-default items-center rounded border px-1.5 text-xs font-medium"
                        onClick={(e) => e?.stopPropagation?.()}
                      >
                        +{hiddenOptions?.length ?? 0}
                        {maxTagLabel ? ` ${maxTagLabel}` : ""}
                      </span>
                    </TooltipTrigger>
                    {showMaxTagTooltip && (
                      <TooltipContent className="max-h-48 max-w-xs overflow-y-auto p-2">
                        <div className="flex flex-col gap-1">
                          {hiddenOptions?.map((opt) => (
                            <div
                              key={String(opt?.value)}
                              className="flex items-center gap-1.5 text-xs"
                            >
                              {opt?.icon}
                              <span className="truncate">{opt?.label}</span>
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Search input directly inside multi-select chips */}
              {isSearchable ? (
                <input
                  ref={searchInputRef}
                  id={name ? `${name}-input` : undefined}
                  name={name}
                  type="text"
                  disabled={disabled}
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onKeyDown={(e) => {
                    if (
                      e?.key === "Backspace" &&
                      searchQuery === "" &&
                      (selectedOptions?.length ?? 0) > 0
                    ) {
                      const last = selectedOptions?.[selectedOptions.length - 1];
                      if (last) {
                        const updated = selectedOptions?.slice(0, -1) ?? [];
                        setInternalValue(updated);
                        onValueChange?.(updated);
                      }
                    }
                  }}
                  placeholder={(selectedOptions?.length ?? 0) === 0 ? placeholder : ""}
                  className="placeholder:text-muted-foreground min-w-[50px] flex-1 bg-transparent py-0.5 text-sm outline-none"
                />
              ) : (selectedOptions?.length ?? 0) === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : null}
            </Fragment>
          ) : (
            /* Single Select Display */
            <div className="flex min-w-0 flex-1 items-center">
              {isSearchable && isOpen ? (
                <input
                  ref={searchInputRef}
                  id={name ? `${name}-input` : undefined}
                  name={name}
                  type="text"
                  disabled={disabled}
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder={searchPlaceholder}
                  className="placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
                />
              ) : (selectedOptions?.length ?? 0) > 0 ? (
                <span className="flex items-center gap-2 truncate">
                  {selectedOptions?.[0]?.icon}
                  <span className="truncate">{selectedOptions?.[0]?.label}</span>
                </span>
              ) : (
                <span className="text-muted-foreground truncate">{placeholder}</span>
              )}
            </div>
          )}
        </div>

        {/* Right Action Icons */}
        <div className="ml-2 flex shrink-0 items-center gap-1">
          {loading && <Loader2 className="text-muted-foreground size-4 animate-spin" />}

          {isClearable && !disabled && (selectedOptions?.length ?? 0) > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground inline-flex size-4 cursor-pointer items-center justify-center rounded-sm"
              aria-label="Clear selection"
            >
              <X className="size-3.5" />
            </button>
          )}

          <ChevronDown
            className={cn("text-muted-foreground size-4 transition-transform duration-200", {
              "rotate-180": isOpen,
            })}
          />
        </div>
      </div>

      {/* Virtualized Options Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          className={cn(
            "bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border shadow-md",
            popoverClassName,
          )}
        >
          {/* Top Search bar for single select if searchable */}
          {!isMultiSelect && isSearchable && (
            <div className="border-b p-2">
              <div className="relative flex items-center">
                <Search className="text-muted-foreground pointer-events-none absolute left-2.5 size-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder={searchPlaceholder}
                  className="placeholder:text-muted-foreground h-8 w-full rounded-sm bg-transparent pr-2 pl-8 text-sm outline-none"
                />
              </div>
            </div>
          )}

          {/* Select all / Deselect all bar */}
          {isMultiSelect && showSelectAll && (
            <div className="flex items-center justify-between border-b px-3 py-1.5 text-xs">
              <span className="text-muted-foreground">
                {selectedOptions?.length ?? 0} of {allOptionsCount(options)} selected
              </span>
              <button
                type="button"
                onClick={handleToggleAll}
                className="text-primary font-medium hover:underline"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>
          )}

          {/* Virtualized scroll container */}
          <div
            ref={scrollParentRef}
            onScroll={handleScroll}
            style={{ maxHeight }}
            className="overflow-y-auto p-1"
          >
            {(filteredOptions?.length ?? 0) === 0 && !loading && !isLoadingMore ? (
              <div className="text-muted-foreground py-6 text-center text-sm">
                No options found.
              </div>
            ) : (
              <div
                style={{
                  height: `${rowVirtualizer?.getTotalSize?.() ?? 0}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {rowVirtualizer?.getVirtualItems?.()?.map((virtualRow) => {
                  const option = filteredOptions?.[virtualRow?.index];
                  if (!option) return null;

                  const selected = isSelected(option);

                  return (
                    <div
                      key={String(option?.value)}
                      role="option"
                      aria-selected={selected}
                      onClick={() => handleSelect(option)}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualRow?.size ?? 0}px`,
                        transform: `translateY(${virtualRow?.start ?? 0}px)`,
                      }}
                      className={cn(
                        "hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm select-none",
                        selected && "bg-accent/60 font-medium",
                        option?.disabled && "pointer-events-none opacity-50",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {option?.icon}
                        <div className="flex flex-col truncate">
                          <span className="truncate">{option?.label}</span>
                          {option?.description && (
                            <span className="text-muted-foreground truncate text-xs">
                              {option?.description}
                            </span>
                          )}
                        </div>
                      </div>

                      {selected && <Check className="text-primary size-4 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}

            {isLoadingMore && (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-2 text-xs">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Loading more…</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function allOptionsCount<T>(options?: SelectOption<T>[]): number {
  return options?.length ?? 0;
}
