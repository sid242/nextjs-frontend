"use client";

import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ElementType,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

/**
 * Hydration-safe client-mount detection using useSyncExternalStore.
 * Avoids layout flashing while guaranteeing strict SSR hydration matching.
 */
function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export interface ResponsiveOverflowProps {
  /** The HTML element (or custom React component) to use as the container (defaults to 'div') */
  as?: ElementType;
  /** The elements / items to layout and overflow-manage */
  children: ReactNode;
  /**
   * Render prop called when items overflow.
   * Receives the count of hidden items, their 0-based indices, and the array of hidden React nodes.
   */
  renderMore: (
    hiddenCount: number,
    hiddenIndices: number[],
    hiddenChildren: ReactNode[],
  ) => ReactNode;
  /** Optional class name for the container */
  className?: string;
  /** Gap between elements in pixels (defaults to 4) */
  gap?: number;
  /**
   * Explicit reserved width for the "More" button in pixels.
   * If omitted or undefined, ResponsiveOverflow automatically measures the rendered `renderMore` element.
   */
  moreWidth?: number;
  /** Fixed number of elements to show, or 'responsive' to calculate dynamically based on container width */
  maxCount?: number | "responsive";
  /** Max lines to show (only used when mode is 'wrap-lines') */
  maxLines?: number;
  /** Layout mode: 'horizontal' (single line strip) or 'wrap-lines' (multiple lines with clamp) */
  mode?: "horizontal" | "wrap-lines";
  /** Direct ref forwarding for the container element */
  ref?: Ref<HTMLElement>;
}

/**
 * ResponsiveOverflow
 *
 * A smart layout molecule that automatically calculates how many items fit in
 * the container without overflowing, sweeping remaining items into a customizable
 * "More" indicator (dropdown, badge, tooltip, etc.).
 *
 * Features:
 * - Dynamic pixel-accurate More measurement (no hardcoded widths needed)
 * - Space recovery: if all items fit, More is never shown and no items are dropped
 * - Zero-size clipping measurement box to prevent scroll container expansion
 * - SSR hydration-safe with zero layout shifts
 */
export function ResponsiveOverflow({
  as: Component = "div",
  children,
  renderMore,
  className,
  gap = 4,
  moreWidth,
  maxCount = "responsive",
  maxLines = 1,
  mode = "horizontal",
  ref,
}: ResponsiveOverflowProps) {
  const containerRef = useRef<HTMLElement>(null);
  const measurementRef = useRef<HTMLDivElement>(null);
  const moreMeasureRef = useRef<HTMLDivElement>(null);

  const childArray = useMemo(() => Children.toArray(children), [children]);
  const isMounted = useIsMounted();
  const [responsiveCount, setResponsiveCount] = useState<number>(childArray?.length ?? 0);

  useEffect(() => {
    if (!isMounted) return;

    const container = containerRef?.current;
    const measurementDiv = measurementRef?.current;
    if (!container || (maxCount === "responsive" && !measurementDiv)) return;

    const calculate = () => {
      const containerWidth = container?.offsetWidth ?? 0;
      const targetDiv =
        mode === "horizontal" && maxCount === "responsive" ? measurementDiv : container;

      if (!targetDiv) return;

      const elements = Array.from(targetDiv?.children ?? []) as HTMLElement[];
      if ((elements?.length ?? 0) === 0) return;

      if (mode === "horizontal") {
        if (maxCount !== "responsive") return;

        // Container of zero width has not yet been laid out (e.g., display: none or first paint).
        // Keep all visible until a real measurement arrives from ResizeObserver.
        if (containerWidth === 0) {
          setResponsiveCount(childArray?.length ?? 0);
          return;
        }

        // Measure item widths
        const itemWidths: number[] = [];
        let totalItemsWidth = 0;

        for (let i = 0; i < (elements?.length ?? 0); i++) {
          const el = elements?.[i];
          const w = (el?.offsetWidth ?? 0) + (i > 0 ? gap : 0);
          itemWidths.push(w);
          totalItemsWidth += w;
        }

        // 1. Check if all items fit without needing any "More" button!
        if (totalItemsWidth <= containerWidth) {
          setResponsiveCount(childArray?.length ?? 0);
          return;
        }

        // 2. Measure the exact width needed for the More indicator
        const measuredMoreWidth =
          moreWidth ??
          (moreMeasureRef?.current?.offsetWidth ? moreMeasureRef.current.offsetWidth + gap : 40);

        const availableWidth = containerWidth - measuredMoreWidth;
        let usedWidth = 0;
        let count = 0;

        for (let i = 0; i < itemWidths.length; i++) {
          const w = itemWidths[i] ?? 0;
          if (usedWidth + w > availableWidth) break;
          usedWidth += w;
          count += 1;
        }

        // Always keep at least 1 item visible if there's at least one child
        setResponsiveCount(Math.max(1, count));
      } else if (mode === "wrap-lines") {
        const firstElement = elements?.[0];
        if (!firstElement) return;

        const firstTop = firstElement?.offsetTop ?? 0;
        let currentLine = 1;
        let count = 0;

        for (let i = 0; i < (elements?.length ?? 0); i++) {
          const el = elements?.[i];
          if (!el) continue;

          if (el.offsetTop > firstTop + (currentLine - 1) * (el?.offsetHeight ?? 0) + gap) {
            currentLine += 1;
          }
          if (currentLine > maxLines) break;
          count += 1;
        }

        setResponsiveCount(count);
      }
    };

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(calculate);
    });

    observer.observe(container);
    calculate();

    return () => observer?.disconnect?.();
  }, [childArray, maxCount, gap, moreWidth, mode, maxLines, isMounted]);

  const effectiveCount = isMounted
    ? typeof maxCount === "number"
      ? maxCount
      : responsiveCount
    : (childArray?.length ?? 0);

  const visibleItems = childArray?.slice(0, effectiveCount) ?? [];
  const hiddenIndices = (childArray ?? [])?.map((_, i) => i)?.slice(effectiveCount) ?? [];
  const hiddenChildren = childArray?.slice(effectiveCount) ?? [];
  const isOverflowing = isMounted && (childArray?.length ?? 0) > effectiveCount;

  // Merge external ref and containerRef
  const handleRef = (node: HTMLElement | null) => {
    (containerRef as { current: HTMLElement | null }).current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref && "current" in ref) {
      (ref as { current: HTMLElement | null }).current = node;
    }
  };

  return (
    <Component
      ref={handleRef}
      style={{ gap }}
      className={cn(
        "relative flex",
        mode === "horizontal" ? "flex-nowrap items-center" : "flex-wrap",
        className,
      )}
    >
      {/*
        Every item on one line, to measure what fits. It sits inside a
        zero-size clipping box so `invisible` hides it without taking it
        out of layout or widening scrolling ancestors.
      */}
      {mode === "horizontal" && maxCount === "responsive" && (
        <div aria-hidden="true" className="pointer-events-none absolute size-0 overflow-hidden">
          <div
            ref={measurementRef}
            className="invisible flex w-max p-0 whitespace-nowrap"
            style={{ gap }}
          >
            {childArray?.map((child, index) => {
              const originalKey = isValidElement(child) ? child?.key : null;
              const wrapperKey = originalKey
                ? `measure-${originalKey}`
                : `measure-fallback-${index}`;
              const childKey = originalKey
                ? `measure-child-${originalKey}`
                : `measure-child-fallback-${index}`;

              return (
                <div key={wrapperKey}>
                  {isValidElement(child) ? cloneElement(child, { key: childKey }) : child}
                </div>
              );
            })}
          </div>

          {/* Invisible measurement for the More element to compute pixel-accurate moreWidth */}
          <div ref={moreMeasureRef} className="invisible flex w-max p-0 whitespace-nowrap">
            {renderMore(
              1,
              [childArray?.length ? childArray.length - 1 : 0],
              childArray?.slice(-1) ?? [],
            )}
          </div>
        </div>
      )}

      {visibleItems}

      {isOverflowing ? (
        <Fragment key="overflow-more">
          {renderMore((childArray?.length ?? 0) - effectiveCount, hiddenIndices, hiddenChildren)}
        </Fragment>
      ) : null}
    </Component>
  );
}
