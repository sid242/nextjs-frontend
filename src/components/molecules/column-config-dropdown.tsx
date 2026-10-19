"use client";

import { ChevronDownIcon, ChevronUpIcon, RotateCcwIcon, SlidersHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ColumnItemState, UseTableColumnsReturn } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export interface ColumnConfigDropdownProps<TId extends string = string> {
  /** Return value from useTableColumns hook for convenience */
  tableColumns?: UseTableColumnsReturn<TId>;
  /** Or pass columnItems explicitly */
  columnItems?: ColumnItemState<TId>[];
  /** Callback when toggling column visibility */
  onToggleColumn?: (id: TId) => void;
  /** Callback when moving column up or down */
  onMoveColumn?: (id: TId, direction: "up" | "down") => void;
  /** Callback to reset columns to default */
  onResetColumns?: () => void;
  /** Whether columns currently differ from defaults */
  isCustomized?: boolean;
  /** Dropdown menu horizontal alignment */
  align?: "start" | "center" | "end";
  /** Trigger button variant */
  variant?: "outline" | "ghost" | "default" | "secondary";
  /** Trigger button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Label text for the trigger button */
  label?: string;
  /** Additional CSS class for the trigger button */
  className?: string;
}

/**
 * Dropdown component allowing users to show/hide and reorder table columns.
 */
export function ColumnConfigDropdown<TId extends string = string>({
  tableColumns,
  columnItems: explicitItems,
  onToggleColumn: explicitToggle,
  onMoveColumn: explicitMove,
  onResetColumns: explicitReset,
  isCustomized: explicitCustomized,
  align = "end",
  variant = "outline",
  size = "sm",
  label = "Columns",
  className,
}: ColumnConfigDropdownProps<TId>) {
  const items = explicitItems ?? tableColumns?.columnItems ?? [];
  const handleToggle = explicitToggle ?? tableColumns?.toggleColumn;
  const handleMove = explicitMove ?? tableColumns?.moveColumn;
  const handleReset = explicitReset ?? tableColumns?.resetColumns;
  const isCustomized = explicitCustomized ?? tableColumns?.isCustomized ?? false;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("relative gap-1.5", className)}
          aria-label="Customize columns"
        >
          <SlidersHorizontalIcon className="size-3.5" />
          <span>{label}</span>
          {isCustomized ? (
            <span
              className="bg-primary absolute -top-1 -right-1 size-2 rounded-full"
              aria-label="Columns customized"
            />
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className="w-64 p-2 shadow-lg"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel className="px-1 py-1">
          <p className="text-xs font-semibold">Customize Columns</p>
          <p className="text-muted-foreground text-[11px] font-normal">
            Show/hide or change column order
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1.5" />

        <div className="flex max-h-64 flex-col gap-1 overflow-y-auto py-0.5">
          {items.map((item) => {
            const isChecked = item.visible;
            const canHide = item.canHide;

            return (
              <div
                key={item.id}
                className="hover:bg-accent/60 flex items-center justify-between gap-2 rounded-sm px-1.5 py-1 text-xs transition-colors"
              >
                <label
                  htmlFor={`col-toggle-${item.id}`}
                  className={cn(
                    "flex flex-1 items-center gap-2 select-none",
                    canHide ? "cursor-pointer" : "cursor-default opacity-80",
                  )}
                >
                  <Checkbox
                    id={`col-toggle-${item.id}`}
                    checked={isChecked}
                    disabled={!canHide}
                    onCheckedChange={() => {
                      if (canHide && handleToggle) {
                        handleToggle(item.id);
                      }
                    }}
                  />
                  <span className="truncate font-medium">{item.label}</span>
                  {!canHide ? (
                    <span className="bg-muted text-muted-foreground ml-auto rounded px-1 py-0.5 text-[10px] font-medium tracking-tight">
                      Required
                    </span>
                  ) : null}
                </label>

                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground size-6 p-0"
                    disabled={item.isFirst}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleMove?.(item.id, "up");
                    }}
                    aria-label={`Move ${item.label} column up`}
                  >
                    <ChevronUpIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground size-6 p-0"
                    disabled={item.isLast}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleMove?.(item.id, "down");
                    }}
                    aria-label={`Move ${item.label} column down`}
                  >
                    <ChevronDownIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <DropdownMenuSeparator className="my-1.5" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-7 w-full justify-center gap-1.5 text-xs font-normal"
          disabled={!isCustomized}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleReset?.();
          }}
        >
          <RotateCcwIcon className="size-3" />
          <span>Reset to defaults</span>
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
