"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Search, Shield } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePlatformRoles } from "@/features/platform";
import { DEFAULT_ROLES, useTenantRoles } from "@/features/rbac";

import { useBindTenantGroupRole } from "../queries";
import { formatPermissionsSummary } from "../utils";

interface AssignGroupRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  scope?: "TENANT" | "PLATFORM";
  tenantId?: string;
  alreadyBoundRoleIds: string[];
}

export function AssignGroupRolesDialog({
  open,
  onOpenChange,
  groupId,
  groupName,
  scope = "TENANT",
  tenantId,
  alreadyBoundRoleIds,
}: AssignGroupRolesDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [reason, setReason] = useState("");

  const isTenant = scope === "TENANT";
  const { data: allTenantRoles = [], isLoading: loadingTenantRoles } = useTenantRoles(
    open && isTenant ? tenantId : undefined,
  );
  const { data: allPlatformRoles = [], isLoading: loadingPlatformRoles } = usePlatformRoles();

  const loadingRoles = isTenant ? loadingTenantRoles : loadingPlatformRoles;
  const bindGroupRoleMutation = useBindTenantGroupRole(tenantId);

  const boundIdSet = useMemo(() => new Set(alreadyBoundRoleIds), [alreadyBoundRoleIds]);

  // Step 1: Available roles belonging to the current scope (excluding already assigned)
  const availableRoles = useMemo(() => {
    const rolesList = isTenant
      ? allTenantRoles.length > 0
        ? allTenantRoles
        : DEFAULT_ROLES
      : allPlatformRoles;
    return rolesList.filter((r) => (r.isActive ?? true) && !boundIdSet.has(r.id));
  }, [isTenant, allTenantRoles, allPlatformRoles, boundIdSet]);

  const filteredRoles = useMemo(() => {
    if (!search.trim()) return availableRoles;
    const term = search.toLowerCase();
    return availableRoles.filter((r) => {
      const codeOrKey = "code" in r ? r.code : "key" in r ? (r as { key?: string }).key : null;
      return (
        r.name.toLowerCase().includes(term) ||
        (codeOrKey && codeOrKey.toLowerCase().includes(term)) ||
        (r.description && r.description.toLowerCase().includes(term)) ||
        (r.permissions && r.permissions.some((p) => p.toLowerCase().includes(term)))
      );
    });
  }, [availableRoles, search]);

  // Step 2: Selecting one or multiple roles
  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  };

  const handleSelectAll = () => {
    if (selectedRoleIds.length === filteredRoles.length) {
      setSelectedRoleIds([]);
    } else {
      setSelectedRoleIds(filteredRoles.map((r) => r.id));
    }
  };

  const handleClose = () => {
    setSelectedRoleIds([]);
    setSearch("");
    setReason("");
    onOpenChange(false);
  };

  // Step 4 & 5: Confirm and save assignment
  const handleAssign = async () => {
    if (selectedRoleIds.length === 0) return;

    try {
      await bindGroupRoleMutation.mutateAsync({
        groupId,
        input: {
          roleIds: selectedRoleIds,
          reason: reason.trim() ? reason.trim() : undefined,
        },
      });

      const count = selectedRoleIds.length;
      toast.success(
        `Successfully assigned ${count} ${count === 1 ? "role" : "roles"} to "${groupName}".`,
      );
      handleClose();
    } catch {
      toast.error("Failed to assign roles to user group.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Assign Roles to Group</DialogTitle>
              <DialogDescription className="text-xs">
                Select workspace roles to grant to all active members of{" "}
                <strong>{groupName}</strong>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 px-6 py-4">
          {/* Search bar & Select All */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search available roles or permissions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>
            {filteredRoles.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="h-9 text-xs"
              >
                {selectedRoleIds.length === filteredRoles.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>

          {/* Roles list */}
          <div className="divide-border max-h-[340px] divide-y overflow-y-auto rounded-xl border">
            {loadingRoles ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : availableRoles.length === 0 ? (
              <div className="text-muted-foreground p-8 text-center text-xs">
                All available workspace roles are already assigned to this group.
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="text-muted-foreground p-8 text-center text-xs">
                No roles match your search term.
              </div>
            ) : (
              filteredRoles.map((role) => {
                const isSelected = selectedRoleIds.includes(role.id);
                const permissionsText = formatPermissionsSummary(role.permissions);

                return (
                  <div
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={`flex cursor-pointer items-start gap-3 p-3.5 transition-colors ${
                      isSelected ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-muted/40"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleRole(role.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-sm font-semibold">{role.name}</span>
                        {("code" in role
                          ? role.code
                          : "key" in role
                            ? (role as { key?: string }).key
                            : null) && (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {"code" in role ? role.code : (role as { key?: string }).key}
                          </Badge>
                        )}
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-[10px]">
                            System
                          </Badge>
                        )}
                      </div>

                      {role.description && (
                        <p className="text-muted-foreground line-clamp-1 text-xs">
                          {role.description}
                        </p>
                      )}

                      {/* Step 3: Display permissions included in each role */}
                      <div className="text-muted-foreground pt-1 text-xs font-medium">
                        {permissionsText}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Optional Reason Input */}
          <div>
            <Input
              placeholder="Reason for assignment (optional, e.g. Quarterly realignment)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-8 text-xs"
              maxLength={255}
            />
          </div>
        </div>

        {/* Step 4: Confirm Assignment Footer */}
        <DialogFooter className="bg-muted/30 border-t px-6 py-3">
          <div className="flex w-full items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">
              {selectedRoleIds.length === 0
                ? "No roles selected"
                : `${selectedRoleIds.length} ${
                    selectedRoleIds.length === 1 ? "role" : "roles"
                  } selected`}
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={selectedRoleIds.length === 0 || bindGroupRoleMutation.isPending}
                onClick={handleAssign}
                className="gap-2"
              >
                {bindGroupRoleMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Assigning…
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    {selectedRoleIds.length > 0
                      ? `Assign ${selectedRoleIds.length} ${
                          selectedRoleIds.length === 1 ? "Role" : "Roles"
                        } to Group`
                      : "Assign Role to Group"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
