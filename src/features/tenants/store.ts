import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { registerStoreReset } from "@/lib/stores/reset";

interface TenantState {
  activeTenantId: string | null;
  setActiveTenantId: (tenantId: string) => void;
}

const DEFAULT_TENANT_ID = "tenant-acme";

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      activeTenantId: DEFAULT_TENANT_ID,
      setActiveTenantId: (activeTenantId) => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("active-tenant-id", activeTenantId);
        }
        set({ activeTenantId });
      },
    }),
    {
      name: "tenant-storage",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeTenantId: state.activeTenantId }),
      skipHydration: true,
    },
  ),
);

// Wipe tenant selection on user sign out
registerStoreReset(() => {
  useTenantStore.setState({ activeTenantId: DEFAULT_TENANT_ID });
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("active-tenant-id");
  }
});
