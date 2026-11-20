"use client";

import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, icons, Search, X } from "lucide-react";

import { DynamicIcon, normalizeIconName } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface IconPickerProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (iconName: string) => void;
  onValueChange?: (iconName: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  isClearable?: boolean;
  iconSize?: number;
  className?: string;
  containerClassName?: string;
  pickerWidth?: number | string;
  ariaLabel?: string;
  error?: string;
}

const CELL_SIZE = 44;
const DEFAULT_COLUMNS = 6;
const GRID_HEIGHT = 280;

/**
 * Pre-extracted sorted list of all Lucide icon names.
 */
const ALL_LUCIDE_ICON_NAMES: string[] = Object.keys(icons).sort();

export function IconPicker({
  id,
  name,
  value: controlledValue,
  defaultValue = "",
  onChange,
  onValueChange,
  placeholder = "Select an icon…",
  searchPlaceholder = "Search 1,500+ Lucide icons…",
  disabled = false,
  isClearable = true,
  iconSize = 18,
  className,
  containerClassName,
  pickerWidth = 320,
  ariaLabel = "Icon selector",
  error,
}: IconPickerProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;

  const [uncontrolledValue, setUncontrolledValue] = useState<string>(defaultValue);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? (controlledValue ?? "") : uncontrolledValue;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    (iconName: string) => {
      if (!isControlled) {
        setUncontrolledValue(iconName);
      }
      onChange?.(iconName);
      onValueChange?.(iconName);
      setIsOpen(false);
      setSearchTerm("");
    },
    [isControlled, onChange, onValueChange],
  );

  const handleClear = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      handleSelect("");
    },
    [handleSelect],
  );

  // Filter icons based on search query
  const filteredIconNames = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return ALL_LUCIDE_ICON_NAMES;

    return ALL_LUCIDE_ICON_NAMES.filter((iconName) => {
      const lower = iconName.toLowerCase();
      return lower.includes(query);
    });
  }, [searchTerm]);

  const numColumns = DEFAULT_COLUMNS;
  const numRows = Math.ceil((filteredIconNames?.length ?? 0) / numColumns);

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: numRows,
    getScrollElement: () => scrollContainerRef?.current,
    estimateSize: () => CELL_SIZE,
    overscan: 5,
  });

  const selectedNormalized = useMemo(
    () => (currentValue ? normalizeIconName(currentValue) : ""),
    [currentValue],
  );

  return (
    <div className={cn("relative inline-block w-full", containerClassName)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <button
            type="button"
            id={fieldId}
            aria-label={ariaLabel}
            aria-expanded={isOpen}
            className={cn(
              "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive focus:ring-destructive",
              className,
            )}
          >
            <div className="flex items-center gap-2 truncate">
              {currentValue ? (
                <>
                  <div className="bg-muted text-foreground flex size-6 shrink-0 items-center justify-center rounded">
                    <DynamicIcon name={currentValue} size={iconSize} />
                  </div>
                  <span className="truncate font-medium">{currentValue}</span>
                </>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1.5 pl-2">
              {isClearable && currentValue && !disabled && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Clear icon"
                  onClick={handleClear}
                  className="text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
              <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform duration-200" />
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          style={{ width: typeof pickerWidth === "number" ? `${pickerWidth}px` : pickerWidth }}
          className="p-3 shadow-lg"
        >
          {/* Search Header */}
          <div className="relative mb-2">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              type="text"
              value={searchTerm}
              placeholder={searchPlaceholder}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="h-8 pr-8 pl-8 text-xs"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 p-0.5"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Virtualized Icon Grid */}
          <div
            ref={scrollContainerRef}
            style={{ height: `${GRID_HEIGHT}px` }}
            className="border-border/50 w-full overflow-y-auto rounded border p-1"
          >
            {(filteredIconNames?.length ?? 0) === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                <Search className="text-muted-foreground mb-1.5 size-6 opacity-40" />
                <p className="text-muted-foreground text-xs">No matching icons found</p>
              </div>
            ) : (
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const rowIndex = virtualRow.index;
                  return (
                    <div
                      key={virtualRow.key}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${CELL_SIZE}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                        display: "grid",
                        gridTemplateColumns: `repeat(${numColumns}, 1fr)`,
                        gap: "4px",
                      }}
                    >
                      {Array.from({ length: numColumns }).map((_, colIndex) => {
                        const iconIndex = rowIndex * numColumns + colIndex;
                        const iconName = filteredIconNames[iconIndex];
                        if (!iconName) return <div key={colIndex} />;

                        const isSelected = iconName === selectedNormalized;

                        return (
                          <button
                            type="button"
                            key={iconName}
                            title={iconName}
                            onClick={() => handleSelect(iconName)}
                            className={cn(
                              "text-foreground hover:bg-accent hover:text-accent-foreground flex size-10 items-center justify-center rounded-md border transition-all",
                              isSelected
                                ? "border-primary bg-primary/10 text-primary ring-primary ring-1"
                                : "border-transparent bg-transparent",
                            )}
                          >
                            <DynamicIcon name={iconName} size={iconSize} />
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Status */}
          <div className="text-muted-foreground mt-2 flex items-center justify-between text-[11px]">
            <span>
              {filteredIconNames?.length?.toLocaleString() ?? 0} icon
              {filteredIconNames?.length === 1 ? "" : "s"}
            </span>
            {currentValue && (
              <button
                type="button"
                onClick={() => handleSelect("")}
                className="hover:text-destructive transition-colors"
              >
                Clear selection
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
