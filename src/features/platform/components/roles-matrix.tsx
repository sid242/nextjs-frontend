"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Lock, Plus, ShieldAlert, ShieldCheck } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { ControlledInput, ControlledTextarea, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api/errors";

import { useCreatePlatformRole, usePlatformPermissions, usePlatformRoles } from "../queries";
import {
  createPlatformRoleSchema,
  type CreatePlatformRoleInput,
  type PlatformPermission,
  type PlatformRole,
} from "../schemas";

export function RolesMatrix() {
  const { data: roles = [], isLoading: rolesLoading } = usePlatformRoles();
  const { data: permissions = [], isLoading: permsLoading } = usePlatformPermissions();

  const [selectedRole, setSelectedRole] = useState<PlatformRole | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Active role for details inspection
  const activeRole = selectedRole ?? roles[0] ?? null;

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PlatformPermission[]> = {};
    for (const perm of permissions) {
      if (!groups[perm.resource]) {
        groups[perm.resource] = [];
      }
      groups[perm.resource]!.push(perm);
    }
    return groups;
  }, [permissions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Roles &amp; Permissions</h1>
          <p className="text-muted-foreground text-sm">
            Canonical <code>resource::action</code> catalogue governing internal SaaS operations.
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="gap-2 bg-red-600 text-white shadow-md shadow-red-600/20 hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Create Custom Platform Role
        </Button>
      </div>

      {rolesLoading || permsLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Skeleton className="h-96 md:col-span-1" />
          <Skeleton className="h-96 md:col-span-2" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Roles Selector Column */}
          <div className="space-y-3 md:col-span-4">
            <h2 className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
              Configured Roles ({roles.length})
            </h2>
            <div className="space-y-2">
              {roles.map((role) => {
                const isSelected = activeRole?.id === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? "bg-card border-red-500/50 shadow-md ring-1 ring-red-500/30"
                        : "bg-card/40 border-border/80 hover:bg-card/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck
                          className={`h-4 w-4 ${isSelected ? "text-red-500" : "text-muted-foreground"}`}
                        />
                        <span className="text-xs font-semibold tracking-tight">{role.name}</span>
                      </div>
                      {role.isSystem ? (
                        <Badge
                          variant="outline"
                          className="border-muted gap-1 px-1 font-mono text-[9px]"
                        >
                          <Lock className="h-2.5 w-2.5" /> SYSTEM
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="px-1 font-mono text-[9px]">
                          CUSTOM
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-[11px]">
                      {role.description ?? "Custom operational role"}
                    </p>
                    <div className="text-muted-foreground mt-2.5 flex items-center gap-2 font-mono text-[10px]">
                      <span className="bg-muted/60 rounded px-1.5 py-0.5">{role.key}</span>
                      <span>&bull;</span>
                      <span>{role.permissions.length} permissions</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role Detail & Permission Matrix Column */}
          <div className="md:col-span-8">
            {activeRole ? (
              <Card className="border-border/80 bg-card/60">
                <CardHeader className="border-b pb-4">
                  <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold">{activeRole.name}</CardTitle>
                        <Badge
                          variant="outline"
                          className="border-red-500/30 font-mono text-xs text-red-500"
                        >
                          {activeRole.key}
                        </Badge>
                        {activeRole.isSystem && (
                          <Badge variant="outline" className="gap-1 font-mono text-[10px]">
                            <Lock className="h-3 w-3" /> System Immutable
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1 text-xs">
                        {activeRole.description ??
                          "Custom role granted specific canonical privileges."}
                      </CardDescription>
                    </div>

                    <div className="text-muted-foreground bg-muted/40 rounded-md px-2.5 py-1 font-mono text-xs">
                      {activeRole.permissions.length} Granted Privileges
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="max-h-[600px] space-y-6 overflow-y-auto pt-5">
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource} className="space-y-2.5">
                      <div className="flex items-center gap-2 border-b pb-1.5">
                        <span className="text-foreground font-mono text-xs font-bold tracking-wider uppercase">
                          {resource.replace(/_/g, " ")}
                        </span>
                        <span className="text-muted-foreground font-mono text-[10px]">
                          ({perms.length} actions)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {perms.map((perm) => {
                          const isGranted =
                            activeRole.permissions.includes(perm.key) ||
                            activeRole.permissions.includes("*");
                          return (
                            <div
                              key={perm.id}
                              className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs transition-colors ${
                                isGranted
                                  ? "border-red-500/25 bg-red-500/5"
                                  : "bg-muted/20 border-border/60 opacity-60"
                              }`}
                            >
                              <div
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                                  isGranted
                                    ? "bg-red-500 text-white"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {isGranted ? <Check className="h-2.5 w-2.5" /> : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-foreground flex items-center justify-between gap-1 font-semibold">
                                  <span className="truncate">{perm.name}</span>
                                  <code className="text-muted-foreground shrink-0 font-mono text-[10px]">
                                    {perm.action}
                                  </code>
                                </div>
                                <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[10px]">
                                  {perm.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <div className="text-muted-foreground rounded-xl border p-12 text-center text-sm">
                Select a platform role to view its effective permissions matrix.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Custom Role Dialog */}
      <CreatePlatformRoleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        permissions={permissions}
        groupedPermissions={groupedPermissions}
      />
    </div>
  );
}

function CreatePlatformRoleDialog({
  open,
  onOpenChange,
  permissions,
  groupedPermissions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: PlatformPermission[];
  groupedPermissions: Record<string, PlatformPermission[]>;
}) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { mutateAsync: createRole, isPending } = useCreatePlatformRole();

  const methods = useForm<CreatePlatformRoleInput>({
    resolver: zodResolver(createPlatformRoleSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      permissionKeys: [],
    },
  });

  const selectedPermissions = useWatch({ control: methods.control, name: "permissionKeys" }) ?? [];

  const togglePermissionSelection = (key: string) => {
    const current = methods.getValues("permissionKeys") ?? [];
    const next = current.includes(key) ? current.filter((p) => p !== key) : [...current, key];
    methods.setValue("permissionKeys", next, { shouldValidate: true });
  };

  const onSubmit = async (values: CreatePlatformRoleInput) => {
    setErrorMsg(null);
    try {
      await createRole({
        key: values.key.toUpperCase().trim(),
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        permissionKeys: values.permissionKeys,
      });
      methods.reset();
      onOpenChange(false);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, "Failed to create platform role"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            Create Custom Platform Role
          </DialogTitle>
          <DialogDescription className="text-xs">
            Define operational grants using canonical <code>resource::action</code> permissions.
          </DialogDescription>
        </DialogHeader>

        <FormWrapper
          methods={methods}
          onSubmit={onSubmit}
          className="flex-1 space-y-4 overflow-y-auto py-2"
        >
          {errorMsg ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <ControlledInput
              name="name"
              label="Role Name"
              placeholder="Security Auditor"
              required
              className="h-9 text-xs"
            />

            <ControlledInput
              name="key"
              label="Role Key (Uppercase & Underscores)"
              placeholder="SECURITY_AUDITOR"
              required
              className="h-9 font-mono text-xs"
            />
          </div>

          <ControlledTextarea
            name="description"
            label="Description"
            placeholder="What responsibilities does this role hold?"
            className="h-16 resize-none text-xs"
          />

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b pb-1">
              <Label className="font-mono text-xs font-bold tracking-wider uppercase">
                Canonical Permissions ({selectedPermissions.length} selected)
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px]"
                onClick={() => {
                  if (selectedPermissions.length === permissions.length) {
                    methods.setValue("permissionKeys", [], { shouldValidate: true });
                  } else {
                    methods.setValue(
                      "permissionKeys",
                      permissions.map((p) => p.key),
                      { shouldValidate: true },
                    );
                  }
                }}
              >
                {selectedPermissions.length === permissions.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            <div className="max-h-64 space-y-4 overflow-y-auto pr-1">
              {Object.entries(groupedPermissions).map(([resource, perms]) => (
                <div key={resource} className="space-y-1.5">
                  <div className="text-muted-foreground font-mono text-[11px] font-bold uppercase">
                    {resource.replace(/_/g, " ")}
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {perms.map((perm) => {
                      const isChecked = selectedPermissions.includes(perm.key);
                      return (
                        <label
                          key={perm.id}
                          className={`flex cursor-pointer items-start gap-2 rounded border p-2 text-xs transition-colors ${
                            isChecked
                              ? "text-foreground border-red-500/40 bg-red-500/10"
                              : "bg-card border-border/60 hover:bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => togglePermissionSelection(perm.key)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-foreground text-xs leading-none font-semibold">
                              {perm.name}
                            </div>
                            <code className="text-muted-foreground mt-1 block font-mono text-[9px]">
                              {perm.key}
                            </code>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton
              pending={isPending}
              pendingText="Creating Role..."
              size="sm"
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Save Custom Role
            </SubmitButton>
          </DialogFooter>
        </FormWrapper>
      </DialogContent>
    </Dialog>
  );
}
