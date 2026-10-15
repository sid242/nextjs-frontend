import { create } from "zustand";
import { registerStoreReset } from "@/lib/stores/reset";
import { clearFinished, patchItem, removeItem, type UploadItem } from "./upload-state";

interface UploadStoreState {
  items: UploadItem[];
  add: (item: UploadItem) => void;
  patch: (id: string, patch: Partial<Omit<UploadItem, "id">>) => void;
  remove: (id: string) => void;
  clearFinished: () => void;
}

export const useUploadStore = create<UploadStoreState>()((set) => ({
  items: [],
  add: (item) => set((state) => ({ items: [...state.items, item] })),
  patch: (id, patch) =>
    set((state) => {
      const items = patchItem(state.items, id, patch);
      return items === state.items ? state : { items };
    }),
  remove: (id) => set((state) => ({ items: removeItem(state.items, id) })),
  clearFinished: () => set((state) => ({ items: clearFinished(state.items) })),
}));

/** Live AbortControllers by upload id. Not in the store: they aren't render state. */
export const uploadControllers = new Map<string, AbortController>();

// Sign-out/sign-in: cancel in-flight uploads and forget the file names of the previous user.
registerStoreReset(() => {
  for (const controller of uploadControllers.values()) controller.abort();
  uploadControllers.clear();
  useUploadStore.setState({ items: [] });
});
