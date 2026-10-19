"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export { debounce, type DebouncedFunction } from "@/lib/debounce";

export interface DebouncedCallback<T extends (...args: never[]) => void> {
  /** The debounced function execution */
  run: (...args: Parameters<T>) => void;
  /** Cancels any pending debounced execution */
  cancel: () => void;
  /** Immediately executes any pending debounced call */
  flush: () => void;
}

/**
 * Returns a debounced version of the provided value that only updates after
 * the specified delay has elapsed without new values. Ideal for controlled input
 * states driving asynchronous operations like TanStack Query.
 *
 * @param value The value to debounce.
 * @param delay Delay in milliseconds (default: 300ms).
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Returns a memoized, debounced callback that maintains the latest closure scope
 * without suffering from stale closures. Includes `.cancel()` and `.flush()` controls,
 * and automatically cancels pending executions on component unmount.
 *
 * Fully compliant with React 19 compiler rules.
 *
 * @param callback The function to debounce.
 * @param delay Delay in milliseconds (default: 300ms).
 */
export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delay = 300,
): DebouncedCallback<T> {
  const callbackRef = useRef<T>(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  // Keep callback reference updated on every render to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    lastArgsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current !== null && lastArgsRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      callbackRef.current(...lastArgsRef.current);
      lastArgsRef.current = null;
    }
  }, []);

  const run = useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (lastArgsRef.current !== null) {
          callbackRef.current(...lastArgsRef.current);
          lastArgsRef.current = null;
        }
      }, delay);
    },
    [delay],
  );

  return { run, cancel, flush };
}
