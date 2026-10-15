/**
 * Registry so every store holding per-user data can be wiped on sign-in/sign-out.
 * Module-level stores outlive route changes, so without this one user's data could be visible to the next
 * person who signs in on the same tab.
 */
const resetters = new Set<() => void>();

export function registerStoreReset(reset: () => void): () => void {
  resetters.add(reset);
  return () => {
    resetters.delete(reset);
  };
}

export function resetAllStores(): void {
  for (const reset of resetters) reset();
}
