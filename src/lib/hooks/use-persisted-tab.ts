"use client";

import { useCallback, useState } from "react";

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

/**
 * Helper to safely read a URL query parameter in the browser without importing
 * `useSearchParams` from next/navigation, which avoids triggering Next.js dynamic
 * client-side suspense or infinite loading boundaries when Suspense is omitted.
 */
function getBrowserQueryParam(name: string): string | null {
  if (typeof window === "undefined" || !window.location.search) return null;
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

export function usePersistedTab<T extends string>({
  paramName = "tab",
  defaultTab,
  allowedTabs,
  storageKey,
}: UsePersistedTabOptions<T>) {
  // Read initial tab safely without Next.js App Router de-opt
  const [persistedTab, setPersistedTab] = useState<T | null>(() => {
    const urlVal = getBrowserQueryParam(paramName);
    if (urlVal && (allowedTabs as readonly string[]).includes(urlVal)) {
      return urlVal as T;
    }

    if (storageKey && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored && (allowedTabs as readonly string[]).includes(stored)) {
          return stored as T;
        }
      } catch {
        return null;
      }
    }
    return null;
  });

  // Calculate the active tab purely during render
  const currentUrlParam = getBrowserQueryParam(paramName);
  const activeTab = resolveInitialTab({
    paramValue: currentUrlParam ?? persistedTab,
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

      // Persist to URL synchronously without page reload or scroll jumps
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
    [allowedTabs, storageKey, paramName],
  );

  return [activeTab, setTab] as const;
}
