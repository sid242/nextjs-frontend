import { useMemo, useState } from "react";
import { CheckCheckIcon, SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { AppModule, Permission } from "../schemas";
import { ModulePermissionCard } from "./module-permission-card";

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTenantName?: string;
  rawModules?: AppModule[];
  rawPermissions?: Permission[];
  onSubmit: (data: { name: string; description?: string; permissions: string[] }) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateRoleDialog({
  open,
  onOpenChange,
  activeTenantName,
  rawModules = [],
  rawPermissions = [],
  onSubmit,
  isSubmitting = false,
}: CreateRoleDialogProps) {
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Harmonize modules and permissions
  const modulesWithPermissions = useMemo<AppModule[]>(() => {
    if (rawModules && rawModules.length > 0) {
      return rawModules;
    }
    // Fallback: group flat permissions by key prefix
    const groups = new Map<string, Permission[]>();
    for (const p of rawPermissions) {
      const prefix = p?.key?.split(":")[0] ?? "general";
      const list = groups.get(prefix) ?? [];
      list.push(p);
      groups.set(prefix, list);
    }
    return Array.from(groups.entries()).map(([prefix, perms]) => ({
      id: `mod-${prefix}`,
      key: prefix,
      name: prefix.charAt(0).toUpperCase() + prefix.slice(1),
      sortOrder: 1,
      isSystem: true,
      permissions: perms,
    }));
  }, [rawModules, rawPermissions]);

  // All unique permissions flattened
  const allPermissions = useMemo<Permission[]>(() => {
    const list: Permission[] = [];
    const seen = new Set<string>();
    for (const m of modulesWithPermissions) {
      for (const p of m?.permissions ?? []) {
        if (p?.key && !seen.has(p.key)) {
          seen.add(p.key);
          list.push(p);
        }
      }
    }
    return list;
  }, [modulesWithPermissions]);

  // Filter modules and permissions according to search
  const filteredModules = useMemo(() => {
    const query = searchQuery?.trim().toLowerCase();
    if (!query) return modulesWithPermissions;

    return modulesWithPermissions
      .map((mod) => {
        const modMatches =
          mod?.name?.toLowerCase().includes(query) ||
          mod?.description?.toLowerCase().includes(query) ||
          mod?.key?.toLowerCase().includes(query);

        const matchingPerms = (mod?.permissions ?? []).filter(
          (p) =>
            p?.name?.toLowerCase().includes(query) ||
            p?.key?.toLowerCase().includes(query) ||
            p?.description?.toLowerCase().includes(query) ||
            p?.action?.toLowerCase().includes(query),
        );

        if (modMatches) {
          return mod;
        }

        if (matchingPerms.length > 0) {
          return {
            ...mod,
            permissions: matchingPerms,
          };
        }

        return null;
      })
      .filter((m): m is AppModule => m !== null);
  }, [modulesWithPermissions, searchQuery]);

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const toggleModulePermissions = (modulePermKeys: string[]) => {
    const allSelected = modulePermKeys.every((k) => selectedPermissions.includes(k));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((k) => !modulePermKeys.includes(k)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...modulePermKeys])));
    }
  };

  const handleSelectAllGlobal = () => {
    const allKeys = allPermissions.map((p) => p.key);
    setSelectedPermissions(allKeys);
  };

  const handleClearAllGlobal = () => {
    setSelectedPermissions([]);
  };

  const handleFormSubmit = async () => {
    if (!roleName.trim() || selectedPermissions.length === 0) return;
    await onSubmit({
      name: roleName.trim(),
      description: roleDesc.trim() || undefined,
      permissions: selectedPermissions,
    });
    setRoleName("");
    setRoleDesc("");
    setSelectedPermissions([]);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Custom Workspace Role</DialogTitle>
          <DialogDescription>
            Define tailored access permissions grouped by application modules for{" "}
            {activeTenantName ?? "this workspace"}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* Role Metadata Inputs */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="role-name" className="text-xs font-semibold">
                Role Name *
              </Label>
              <Input
                id="role-name"
                placeholder="e.g. Storage Manager, Compliance Officer"
                value={roleName}
                onChange={(e) => setRoleName(e?.target?.value ?? "")}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="role-desc" className="text-xs font-semibold">
                Description
              </Label>
              <Input
                id="role-desc"
                placeholder="Summary of responsibilities and scope"
                value={roleDesc}
                onChange={(e) => setRoleDesc(e?.target?.value ?? "")}
              />
            </div>
          </div>

          {/* Permission Scopes Section */}
          <div className="grid gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Module-Wise Permissions
                </Label>
                <p className="text-muted-foreground text-[11px]">
                  {selectedPermissions.length} of {allPermissions.length} permissions selected
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSelectAllGlobal}
                >
                  <CheckCheckIcon className="mr-1 size-3.5" /> Select All
                </Button>
                {selectedPermissions.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground h-7 text-xs"
                    onClick={handleClearAllGlobal}
                  >
                    <XIcon className="mr-1 size-3.5" /> Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Search input for permissions */}
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
              <Input
                placeholder="Search modules, scopes, or actions (e.g. files, invite, delete)…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e?.target?.value ?? "")}
                className="pl-9 text-xs"
              />
            </div>

            {/* Module Cards */}
            <div className="grid max-h-[50vh] gap-4 overflow-y-auto pr-1">
              {filteredModules.length === 0 ? (
                <div className="border-border/80 text-muted-foreground rounded-lg border border-dashed p-8 text-center text-xs">
                  No matching permissions or modules found for &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                filteredModules.map((mod) => (
                  <ModulePermissionCard
                    key={mod?.id ?? mod?.key}
                    module={mod}
                    selectedPermissions={selectedPermissions}
                    onTogglePermission={togglePermission}
                    onToggleModulePermissions={toggleModulePermissions}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-border/50 border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleFormSubmit}
            disabled={!roleName.trim() || selectedPermissions.length === 0 || isSubmitting}
          >
            {isSubmitting ? "Creating…" : `Create Role (${selectedPermissions.length} scopes)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
