import type { FileFolderRecord } from "@/lib/api/types";

/**
 * Returns the breadcrumb chain of folders from root ancestor down to the active folder.
 * Example: For "Q1" (child of "2026", child of "Invoices"), returns:
 * [Invoices, 2026, Q1]
 */
export function getFolderBreadcrumbTrail(
  activeFolderId: string | null,
  folders: FileFolderRecord[],
): FileFolderRecord[] {
  if (!activeFolderId || !folders || folders.length === 0) return [];

  const folderMap = new Map<string, FileFolderRecord>(folders.map((f) => [f.id, f]));
  const trail: FileFolderRecord[] = [];
  const visited = new Set<string>();

  let curr: FileFolderRecord | undefined = folderMap.get(activeFolderId);
  while (curr && !visited.has(curr.id)) {
    visited.add(curr.id);
    trail.unshift(curr);
    curr = curr.parentId ? folderMap.get(curr.parentId) : undefined;
  }

  return trail;
}

/**
 * Returns the human-readable path string for a given folder.
 * Example: "Invoices / 2026 / Q1"
 */
export function getFolderPath(folderId: string, folders: FileFolderRecord[]): string {
  const trail = getFolderBreadcrumbTrail(folderId, folders);
  if (trail.length === 0) return "Root";
  return trail.map((f) => f.name).join(" / ");
}

/**
 * Returns immediate children of a parent folder (or root folders if parentId is null).
 */
export function getSubfolders(
  parentId: string | null,
  folders: FileFolderRecord[],
): FileFolderRecord[] {
  if (!folders || folders.length === 0) return [];
  return folders.filter((f) => {
    if (parentId === null || parentId === undefined) {
      return !f.parentId;
    }
    return f.parentId === parentId;
  });
}

/**
 * Returns a Set of all recursive descendant folder IDs for a given folder.
 * Useful to prevent circular parent references when moving folders.
 */
export function getFolderDescendantIds(folderId: string, folders: FileFolderRecord[]): Set<string> {
  const descendants = new Set<string>();
  if (!folderId || !folders || folders.length === 0) return descendants;

  const queue = [folderId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    for (const f of folders) {
      if (f.parentId === currentId && !descendants.has(f.id)) {
        descendants.add(f.id);
        queue.push(f.id);
      }
    }
  }

  return descendants;
}

export interface FolderTreeOption {
  id: string;
  name: string;
  path: string;
  depth: number;
}

/**
 * Returns folders formatted as a flat hierarchical list ordered by tree depth,
 * optionally excluding specific folder IDs (e.g. self and descendants).
 */
export function formatFolderTreeOptions(
  folders: FileFolderRecord[],
  excludeIds?: Set<string>,
): FolderTreeOption[] {
  if (!folders || folders.length === 0) return [];

  const validFolders = excludeIds ? folders.filter((f) => !excludeIds.has(f.id)) : folders;
  const childrenMap = new Map<string | null, FileFolderRecord[]>();

  for (const f of validFolders) {
    const pId = f.parentId ?? null;
    const existing = childrenMap.get(pId) ?? [];
    existing.push(f);
    childrenMap.set(pId, existing);
  }

  // Sort siblings alphabetically
  for (const list of childrenMap.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  const result: FolderTreeOption[] = [];

  function traverse(parentId: string | null, depth: number, parentPath: string) {
    const children = childrenMap.get(parentId);
    if (!children) return;

    for (const child of children) {
      const currentPath = parentPath ? `${parentPath} / ${child.name}` : child.name;
      result.push({
        id: child.id,
        name: child.name,
        path: currentPath,
        depth,
      });
      traverse(child.id, depth + 1, currentPath);
    }
  }

  traverse(null, 0, "");
  return result;
}
