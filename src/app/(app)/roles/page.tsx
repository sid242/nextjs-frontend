"use client";

import { useState } from "react";
import {
  CheckIcon,
  KeyRoundIcon,
  LockIcon,
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/molecules/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  useCreateTenantRole,
  useDeleteTenantRole,
  usePermissions,
  useTenantRoles,
} from "@/features/rbac";
import { useActiveTenant } from "@/features/tenants";

export default function RolesPage() {
  const { activeTenant, activeTenantId } = useActiveTenant();
  const { data: roles = [], isLoading: rolesLoading } = useTenantRoles(activeTenantId);
  const { data: permissions = [] } = usePermissions();

  const createRoleMutation = useCreateTenantRole(activeTenantId ?? "");
  const deleteRoleMutation = useDeleteTenantRole(activeTenantId ?? "");

  const [createOpen, setCreateOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleCreateRole = async () => {
    if (!roleName.trim() || selectedPermissions.length === 0 || !activeTenantId) return;
    try {
      await createRoleMutation.mutateAsync({
        name: roleName.trim(),
        description: roleDesc.trim() || undefined,
        permissions: selectedPermissions,
      });
      toast.success(`Role "${roleName}" created successfully!`);
      setRoleName("");
      setRoleDesc("");
      setSelectedPermissions([]);
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-medium">Configured Roles</CardDescription>
            <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
              <ShieldCheckIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length} Roles</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {roles.filter((r) => !r.isSystem).length} custom workspace roles
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-medium">Available Scopes</CardDescription>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <KeyRoundIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissions.length} Scopes</div>
            <p className="text-muted-foreground mt-1 text-xs">Enforced at API gateway & backend</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-medium">RBAC Security</CardDescription>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <LockIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Dynamic RBAC</div>
            <p className="text-muted-foreground mt-1 text-xs">Real-time token scope verification</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {rolesLoading ? (
          <div className="p-8 text-center">
            <div className="text-muted-foreground animate-pulse text-sm">
              Loading workspace roles…
            </div>
          </div>
        ) : (
          roles.map((role) => (
            <Card key={role.id} className="border-border/60 transition-all hover:shadow-xs">
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div className="grid gap-1">
                  <div className="flex items-center gap-2.5">
                    <CardTitle className="text-base font-semibold">{role.name}</CardTitle>
                    {role.isSystem ? (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                        System Role
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                        Custom Role
                      </Badge>
                    )}
                    <span className="text-muted-foreground/70 text-xs">
                      {role.usersCount} assigned
                    </span>
                  </div>
                  {role.description && (
                    <CardDescription className="text-xs">{role.description}</CardDescription>
                  )}
                </div>

                {!role.isSystem && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-8"
                    onClick={() => handleDeleteRole(role.id, role.name)}
                    aria-label={`Delete ${role.name}`}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions?.map((perm) => (
                    <Badge
                      key={perm}
                      variant="outline"
                      className="bg-muted/40 border-border/50 text-[11px] font-normal"
                    >
                      {perm}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Custom Role Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Custom Workspace Role</DialogTitle>
            <DialogDescription>
              Define tailored access permissions for members of{" "}
              {activeTenant?.name ?? "this workspace"}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                placeholder="e.g. Finance Auditor, Compliance Officer"
                value={roleName}
                onChange={(e) => setRoleName(e?.target?.value ?? "")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role-desc">Description</Label>
              <Input
                id="role-desc"
                placeholder="Brief summary of duties and privileges"
                value={roleDesc}
                onChange={(e) => setRoleDesc(e?.target?.value ?? "")}
              />
            </div>

            <div className="grid gap-2 pt-2">
              <div className="flex items-center justify-between">
                <Label>Permission Scopes</Label>
                <span className="text-muted-foreground text-xs">
                  {selectedPermissions.length} selected
                </span>
              </div>
              <div className="border-border/60 bg-muted/20 grid max-h-60 gap-2 overflow-y-auto rounded-lg border p-3">
                {permissions.map((p) => {
                  const isChecked = selectedPermissions.includes(p.key);
                  return (
                    <div
                      key={p.key}
                      onClick={() => togglePermission(p.key)}
                      className={`hover:bg-accent/60 flex cursor-pointer items-center justify-between rounded-md border p-2.5 transition-colors ${
                        isChecked ? "border-primary/50 bg-primary/5" : "border-transparent"
                      }`}
                    >
                      <div className="grid leading-tight">
                        <span className="text-foreground text-xs font-semibold">{p.name}</span>
                        <span className="text-muted-foreground/70 font-mono text-[10px]">
                          {p.key}
                        </span>
                      </div>
                      <div
                        className={`flex size-5 items-center justify-center rounded border ${
                          isChecked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isChecked && <CheckIcon className="size-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRole}
              disabled={
                !roleName.trim() || selectedPermissions.length === 0 || createRoleMutation.isPending
              }
            >
              {createRoleMutation.isPending ? "Creating…" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
