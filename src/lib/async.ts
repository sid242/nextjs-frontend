/**
 * Run `worker` over `items` with at most `limit` in flight at once (e.g. 3 concurrent uploads).
 * Resolves when every item has been processed. Workers are expected to handle their own errors.
 */
export async function runWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let next = 0;
  const lane = async () => {
    while (next < items.length) {
      const index = next++;
      await worker(items[index] as T, index);
    }
  };
  const lanes = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: lanes }, lane));
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
