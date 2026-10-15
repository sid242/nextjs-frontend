// Plain module (no "use client") so server components can import the same keys for prefetching.
const all = ["files"] as const;

export const filesKeys = {
  all,
  list: () => [...all, "list"] as const,
};
