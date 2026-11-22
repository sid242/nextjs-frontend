const all = ["files"] as const;
const workspace = (slug: string) => [...all, slug] as const;

export const filesKeys = {
  all,
  workspace,
  list: (slug: string, params?: unknown) => [...workspace(slug), "list", params ?? {}] as const,
  folders: (slug: string, parentId?: string) =>
    [...workspace(slug), "folders", parentId ?? "root"] as const,
  shares: (slug: string, fileId: string) => [...workspace(slug), "shares", fileId] as const,
  versions: (slug: string, fileId: string) => [...workspace(slug), "versions", fileId] as const,
  stats: (slug: string) => [...workspace(slug), "stats"] as const,
};
