import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/*
 * ZUSTAND RULES OF THE ROAD
 *  - Zustand holds CLIENT-ONLY state: UI preferences, ephemeral workflows (upload queue), connection status.
 *  - Server data (users, files, ...) belongs in TanStack Query / server components. Never copy it into a store:
 *    two sources of truth drift apart.
 *  - Stores are module singletons, so only touch them from client components/effects/handlers, never while
 *    rendering on the server (the server process is shared between requests).
 *  - Per-user data must register a reset (see lib/stores/reset.ts) so sign-out/sign-in can't leak it.
 *  - Always subscribe with a selector: useUiStore((s) => s.sidebarCollapsed), never the whole store.
 */

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    }),
    {
      name: "ui",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }), // persist data, not functions
      // Server and first client render both use the defaults; <StoreHydrator /> restores the saved value after
      // mount. Reading localStorage during the first render would cause a hydration mismatch.
      skipHydration: true,
    },
  ),
);
