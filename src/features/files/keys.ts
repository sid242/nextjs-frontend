const all = ["files"] as const;

export const filesKeys = {
  all,
  list: (params?: unknown) => [...all, "list", params ?? {}] as const,
  folders: (parentId?: string) => [...all, "folders", parentId ?? "root"] as const,
  shares: (fileId: string) => [...all, "shares", fileId] as const,
  versions: (fileId: string) => [...all, "versions", fileId] as const,
  stats: () => [...all, "stats"] as const,
};
