import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { tenantStorage } from "@/lib/storage";
import { registerStoreReset } from "@/lib/stores/reset";

interface TenantState {
  activeTenantId: string | null;
  setActiveTenantId: (tenantId: string) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      activeTenantId: tenantStorage.get(),
      setActiveTenantId: (activeTenantId) => {
        tenantStorage.set(activeTenantId);
        set({ activeTenantId });
      },
    }),
    {
      name: "tenant-storage",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeTenantId: state.activeTenantId }),
    },
  ),
);

// Wipe tenant selection on user sign out
registerStoreReset(() => {
  useTenantStore.setState({ activeTenantId: null });
  tenantStorage.clear();
});
