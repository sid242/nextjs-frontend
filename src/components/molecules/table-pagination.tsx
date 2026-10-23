"use client";

import { useMemo } from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}

export type PageItem = number | "ellipsis-start" | "ellipsis-end";

/**
 * Calculates page numbers with ellipses to maintain a stable, accessible range (e.g. 1, 2, 3 ... 8).
 */
export function getPageNumbers(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Near the start: 1, 2, 3, 4, 5, ..., totalPages
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-end", totalPages];
  }

  // Near the end: 1, ..., totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages
  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis-start",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  // In the middle: 1, ..., currentPage - 1, currentPage, currentPage + 1, ..., totalPages
  return [
    1,
    "ellipsis-start",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-end",
    totalPages,
  ];
}

/**
 * Standard reusable table pagination control with range display, page size selector, and numbered page navigation.
 */
export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50],
  onPageSizeChange,
  onPageChange,
  itemLabel = "entries",
  className,
}: TablePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const pages = useMemo(
    () => getPageNumbers(currentPage, safeTotalPages),
    [currentPage, safeTotalPages],
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="text-muted-foreground">
          {totalItems === 0 ? (
            <span>No {itemLabel}</span>
          ) : (
            <span>
              Showing <strong className="text-foreground font-semibold">{startItem}</strong> to{" "}
              <strong className="text-foreground font-semibold">{endItem}</strong> of{" "}
              <strong className="text-foreground font-semibold">{totalItems}</strong> {itemLabel}
            </span>
          )}
        </div>

        {onPageSizeChange && (pageSizeOptions?.length ?? 0) > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground whitespace-nowrap">Rows per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                const parsed = Number(val);
                if (!Number.isNaN(parsed) && parsed > 0) {
                  onPageSizeChange(parsed);
                }
              }}
            >
              <SelectTrigger className="h-8 w-[72px] font-mono text-xs" aria-label="Rows per page">
                <SelectValue placeholder={String(pageSize)} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions?.map((size) => (
                  <SelectItem key={size} value={String(size)} className="font-mono text-xs">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Pagination className="mx-0 w-auto">
        <PaginationContent className="gap-1">
          <PaginationItem>
            <PaginationPrevious
              disabled={currentPage <= 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            />
          </PaginationItem>

          {pages?.map((page, idx) => {
            if (typeof page === "number") {
              const isCurrent = page === currentPage;
              return (
                <PaginationItem key={`page-${page}`}>
                  <PaginationLink
                    isActive={isCurrent}
                    onClick={() => onPageChange(page)}
                    aria-label={`Page ${page}`}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            }

            return (
              <PaginationItem key={`${page}-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          })}

          <PaginationItem>
            <PaginationNext
              disabled={currentPage >= safeTotalPages}
              onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
