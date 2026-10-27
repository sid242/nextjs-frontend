"use client";

import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  GripVerticalIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

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
  /** Callback to reorder columns by start and target index (drag-and-drop) */
  onReorderColumns?: (startIndex: number, endIndex: number) => void;
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
 * Dropdown component allowing users to show/hide and reorder table columns via drag-and-drop or action controls.
 */
export function ColumnConfigDropdown<TId extends string = string>({
  tableColumns,
  columnItems: explicitItems,
  onToggleColumn: explicitToggle,
  onMoveColumn: explicitMove,
  onReorderColumns: explicitReorder,
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
  const handleReorder = explicitReorder ?? tableColumns?.reorderColumns;
  const handleReset = explicitReset ?? tableColumns?.resetColumns;
  const isCustomized = explicitCustomized ?? tableColumns?.isCustomized ?? false;

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e?.dataTransfer?.setData("text/plain", String(index));
    if (e?.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e?.preventDefault?.();
    if (e?.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (_e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e?.preventDefault?.();
    const rawSource = e?.dataTransfer?.getData("text/plain");
    const sourceIndex = draggedIndex ?? (rawSource ? parseInt(rawSource, 10) : NaN);

    if (!Number.isNaN(sourceIndex) && sourceIndex !== targetIndex && handleReorder) {
      handleReorder(sourceIndex, targetIndex);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

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
        className="w-72 p-2 shadow-lg"
        onCloseAutoFocus={(e) => e?.preventDefault?.()}
      >
        <DropdownMenuLabel className="px-1 py-1">
          <p className="text-xs font-semibold">Customize Columns</p>
          <p className="text-muted-foreground text-[11px] font-normal">
            Drag to reorder or toggle visibility
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1.5" />

        <div className="flex max-h-64 flex-col gap-1 overflow-y-auto py-0.5">
          {items?.map((item, index) => {
            const isChecked = item?.visible ?? true;
            const canHide = item?.canHide ?? true;
            const isDragging = draggedIndex === index;
            const isTargeted = dragOverIndex === index && draggedIndex !== index;

            return (
              <div
                key={item?.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={(e) => handleDragLeave(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "hover:bg-accent/60 flex items-center justify-between gap-1.5 rounded-sm px-1.5 py-1 text-xs transition-colors",
                  isDragging && "bg-accent/30 opacity-40",
                  isTargeted && "ring-primary/60 bg-accent/50 ring-1",
                )}
              >
                {/* Drag Grip Handle */}
                <div
                  className="text-muted-foreground/60 hover:text-foreground cursor-grab p-0.5 transition-colors active:cursor-grabbing"
                  title="Drag to reorder column"
                  aria-label={`Drag to reorder ${item?.label}`}
                >
                  <GripVerticalIcon className="size-3.5" />
                </div>

                <label
                  htmlFor={`col-toggle-${item?.id}`}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 select-none",
                    canHide ? "cursor-pointer" : "cursor-default opacity-80",
                  )}
                >
                  <Checkbox
                    id={`col-toggle-${item?.id}`}
                    checked={isChecked}
                    disabled={!canHide}
                    onCheckedChange={() => {
                      if (canHide && handleToggle) {
                        handleToggle(item.id);
                      }
                    }}
                  />
                  <span className="truncate font-medium">{item?.label}</span>
                  {!canHide ? (
                    <span className="bg-muted text-muted-foreground ml-auto rounded px-1 py-0.5 text-[10px] font-medium tracking-tight">
                      Required
                    </span>
                  ) : null}
                </label>

                {/* Accessible Directional Reorder Buttons */}
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground size-5 p-0"
                    disabled={item?.isFirst}
                    onClick={(e) => {
                      e?.stopPropagation?.();
                      e?.preventDefault?.();
                      handleMove?.(item.id, "up");
                    }}
                    aria-label={`Move ${item?.label} column up`}
                  >
                    <ChevronUpIcon className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground size-5 p-0"
                    disabled={item?.isLast}
                    onClick={(e) => {
                      e?.stopPropagation?.();
                      e?.preventDefault?.();
                      handleMove?.(item.id, "down");
                    }}
                    aria-label={`Move ${item?.label} column down`}
                  >
                    <ChevronDownIcon className="size-3" />
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
            e?.stopPropagation?.();
            e?.preventDefault?.();
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
