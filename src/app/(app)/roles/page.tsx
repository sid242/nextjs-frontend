"use client";

import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/molecules/page-header";
import { Button } from "@/components/ui/button";
import {
  CreateRoleDialog,
  RoleCard,
  RoleStatsCards,
  useCreateTenantRole,
  useDeleteTenantRole,
  useModules,
  usePermissions,
  useTenantRoles,
} from "@/features/rbac";
import { useActiveTenant } from "@/features/tenants";

export default function RolesPage() {
  const { activeTenant, activeTenantId } = useActiveTenant();
  const { data: roles = [], isLoading: rolesLoading } = useTenantRoles(activeTenantId);
  const { data: rawModules = [] } = useModules();
  const { data: rawPermissions = [] } = usePermissions();

  const createRoleMutation = useCreateTenantRole(activeTenantId ?? "");
  const deleteRoleMutation = useDeleteTenantRole(activeTenantId ?? "");

  const [createOpen, setCreateOpen] = useState(false);

  const handleCreateRole = async (data: {
    name: string;
    description?: string;
    permissions: string[];
  }) => {
    if (!activeTenantId) return;
    try {
      await createRoleMutation.mutateAsync(data);
      toast.success(`Role "${data.name}" created successfully!`);
      setCreateOpen(false);
    } catch {
      toast.error("Failed to create role. Please try again.");
    }
  };

  const handleDeleteRole = async (roleId: string, name: string) => {
    if (!activeTenantId) return;
    try {
      await deleteRoleMutation.mutateAsync(roleId);
      toast.success(`Role "${name}" removed.`);
    } catch {
      toast.error("Failed to delete role.");
    }
  };

  const customRolesCount = useMemo(() => {
    return roles.filter((r) => !r.isSystem).length;
  }, [roles]);

  const uniqueScopesCount = useMemo(() => {
    const unique = new Set<string>();
    for (const p of rawPermissions) {
      if (p?.key) unique.add(p.key);
    }
    for (const m of rawModules) {
      for (const p of m?.permissions ?? []) {
        if (p?.key) unique.add(p.key);
      }
    }
    return unique.size;
  }, [rawPermissions, rawModules]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Dynamic RBAC & Roles"
          description={`Configure access control policies and customized permissions for ${activeTenant?.name ?? "your organization"}.`}
        />
        <Button onClick={() => setCreateOpen(true)} className="w-full gap-2 shadow-sm sm:w-auto">
          <PlusIcon className="size-4" /> Create Custom Role
        </Button>
      </div>

      <RoleStatsCards
        rolesCount={roles.length}
        customRolesCount={customRolesCount}
        scopesCount={uniqueScopesCount}
        modulesCount={rawModules.length || 5}
      />

      <div className="grid gap-4">
        {rolesLoading ? (
          <div className="p-8 text-center">
            <div className="text-muted-foreground animate-pulse text-sm">
              Loading workspace roles…
            </div>
          </div>
        ) : (
          roles.map((role) => <RoleCard key={role.id} role={role} onDelete={handleDeleteRole} />)
        )}
      </div>

      <CreateRoleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        activeTenantName={activeTenant?.name}
        rawModules={rawModules}
        rawPermissions={rawPermissions}
        onSubmit={handleCreateRole}
        isSubmitting={createRoleMutation.isPending}
      />
    </div>
  );
}
