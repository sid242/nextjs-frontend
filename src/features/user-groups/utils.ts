/**
 * Formats a list of permission keys (e.g. ["leads:read", "leads:create", "leads:update", "reports:read"])
 * into a structured, human-readable summary: "Leads: Read, Create, Update · Reports: Read".
 */
export function formatPermissionsSummary(permissions?: string[]): string {
  if (!permissions || permissions.length === 0) {
    return "No permissions assigned";
  }

  const grouped = new Map<string, string[]>();

  for (const perm of permissions) {
    const separator = perm.includes("::") ? "::" : ":";
    const parts = perm.split(separator);
    if (parts.length >= 2) {
      const rawResource = parts[0]?.trim() ?? "";
      const rawAction = parts.slice(1).join(" ").trim();
      const resource = rawResource.charAt(0).toUpperCase() + rawResource.slice(1);
      const action = rawAction.charAt(0).toUpperCase() + rawAction.slice(1);

      const existing = grouped.get(resource) ?? [];
      if (!existing.includes(action)) {
        existing.push(action);
      }
      grouped.set(resource, existing);
    } else {
      const resource = perm.charAt(0).toUpperCase() + perm.slice(1);
      const existing = grouped.get(resource) ?? [];
      grouped.set(resource, existing);
    }
  }

  const segments: string[] = [];
  for (const [resource, actions] of grouped.entries()) {
    if (actions.length > 0) {
      segments.push(`${resource}: ${actions.join(", ")}`);
    } else {
      segments.push(resource);
    }
  }

  return segments.join(" · ");
}
