import { create } from "zustand";

import { registerStoreReset } from "@/lib/stores/reset";

interface TenantState {
  activeTenantId: string | null;
  activeTenantSlug: string | null;
  setActiveTenant: (data: { id?: string | null; slug?: string | null }) => void;
  setActiveTenantId: (tenantId: string | null) => void;
  setActiveTenantSlug: (slug: string | null) => void;
}

export const useTenantStore = create<TenantState>()((set) => ({
  activeTenantId: null,
  activeTenantSlug: null,
  setActiveTenant: ({ id, slug }) =>
    set((state) => ({
      activeTenantId: id !== undefined ? id : state.activeTenantId,
      activeTenantSlug: slug !== undefined ? slug : state.activeTenantSlug,
    })),
  setActiveTenantId: (activeTenantId) => set({ activeTenantId }),
  setActiveTenantSlug: (activeTenantSlug) => set({ activeTenantSlug }),
}));

// Wipe tenant selection on user sign out
registerStoreReset(() => {
  useTenantStore.setState({ activeTenantId: null, activeTenantSlug: null });
});
