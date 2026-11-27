"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";

export interface UsePersistedTabOptions<T extends string> {
  /**
   * The name of the URL query parameter (defaults to "tab").
   */
  paramName?: string;
  /**
   * Fallback tab if no valid tab is present in URL or storage.
   */
  defaultTab: T;
  /**
   * Allowed tab keys for safety and permission filtering.
   */
  allowedTabs: readonly T[] | T[];
  /**
   * Optional localStorage key to remember the tab across sessions / without query params.
   */
  storageKey?: string;
}

/**
 * Pure helper to resolve the active tab from URL param, localStorage, or fallbacks.
 */
export function resolveInitialTab<T extends string>({
  paramValue,
  storedValue,
  defaultTab,
  allowedTabs,
}: {
  paramValue?: string | null;
  storedValue?: string | null;
  defaultTab: T;
  allowedTabs: readonly T[] | T[];
}): T {
  if (paramValue && (allowedTabs as readonly string[]).includes(paramValue)) {
    return paramValue as T;
  }
  if (storedValue && (allowedTabs as readonly string[]).includes(storedValue)) {
    return storedValue as T;
  }
  if (allowedTabs.includes(defaultTab)) {
    return defaultTab;
  }
  return (allowedTabs[0] ?? defaultTab) as T;
}

export function usePersistedTab<T extends string>({
  paramName = "tab",
  defaultTab,
  allowedTabs,
  storageKey,
}: UsePersistedTabOptions<T>) {
  const searchParams = useSearchParams();

  // Read URL query parameter
  const urlTab = searchParams?.get(paramName) as T | null;

  // Read localStorage fallback on initial client render
  const [persistedTab, setPersistedTab] = useState<T | null>(() => {
    if (storageKey && typeof window !== "undefined") {
      try {
        return localStorage.getItem(storageKey) as T | null;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Calculate the active tab purely during render - zero cascading renders or setState in effects
  const activeTab = resolveInitialTab({
    paramValue: urlTab,
    storedValue: persistedTab,
    defaultTab,
    allowedTabs,
  });

  // Action to switch tab
  const setTab = useCallback(
    (nextTab: string) => {
      const target = nextTab as T;
      if (!allowedTabs.includes(target)) return;

      setPersistedTab(target);

      // Persist to localStorage
      if (storageKey && typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, target);
        } catch {
          // Ignore storage quota errors
        }
      }

      // Persist to URL synchronously without page refresh or scroll jumps
      if (typeof window !== "undefined") {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set(paramName, target);
          window.history.replaceState(window.history.state, "", url.toString());
        } catch {
          // SSR guard
        }
      }
    },
    [allowedTabs, storageKey, paramName, setPersistedTab],
  );

  return [activeTab, setTab] as const;
}
