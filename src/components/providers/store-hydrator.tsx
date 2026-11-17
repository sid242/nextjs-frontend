"use client";

import * as React from "react";

import { useUiStore } from "@/lib/stores/ui-store";

/** Restores persisted zustand stores after hydration (they use skipHydration to avoid SSR mismatches). */
export function StoreHydrator() {
  React.useEffect(() => {
    void useUiStore.persist.rehydrate();

    // One-time legacy storage & cookie cleanup
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("active-tenant-id");
        window.localStorage.removeItem("tenant-storage");
        document.cookie = "active_tenant_id=; path=/; max-age=0; SameSite=Lax";
      }
    } catch {
      /* ignore storage access restrictions */
    }
  }, []);
  return null;
}
