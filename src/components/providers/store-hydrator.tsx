"use client";

import * as React from "react";

import { useUiStore } from "@/lib/stores/ui-store";

/** Restores persisted zustand stores after hydration (they use skipHydration to avoid SSR mismatches). */
export function StoreHydrator() {
  React.useEffect(() => {
    void useUiStore.persist.rehydrate();
  }, []);
  return null;
}
