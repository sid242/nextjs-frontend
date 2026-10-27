"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Lock, Search, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { ControlledInput, ControlledTextarea, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import {
  useCreatePlatformRole,
  usePlatformPermissions,
  usePlatformRoles,
  useUpdatePlatformRole,
} from "../queries";
import {
  createPlatformRoleSchema,
  type CreatePlatformRoleInput,
  type PlatformPermission,
} from "../schemas";

interface RoleFormPageProps {
  roleId?: string;
}

export function RoleFormPage({ roleId }: RoleFormPageProps) {
  const router = useRouter();
  const isEdit = Boolean(roleId);

  const { data: roles = [], isLoading: rolesLoading } = usePlatformRoles();
  const { data: permissions = [], isLoading: permsLoading } = usePlatformPermissions();
  const { mutateAsync: createRole, isPending: isCreating } = useCreatePlatformRole();
  const { mutateAsync: updateRole, isPending: isUpdating } = useUpdatePlatformRole();

  const existingRole = useMemo(
    () => (roleId ? roles.find((r) => r.id === roleId) : null),
    [roles, roleId],
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const methods = useForm<CreatePlatformRoleInput>({
    resolver: zodResolver(createPlatformRoleSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      permissionKeys: [],
    },
  });

  // Populate form in edit mode once role data is loaded
  useEffect(() => {
    if (existingRole) {
      methods.reset({
        name: existingRole.name,
        key: existingRole.key,
        description: existingRole.description ?? "",
        permissionKeys: existingRole.permissions ?? [],
      });
    }
  }, [existingRole, methods]);

  const selectedPermissions = useWatch({ control: methods.control, name: "permissionKeys" }) ?? [];

  // Group permissions by resource category
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PlatformPermission[]> = {};
    for (const perm of permissions) {
      if (
        searchQuery &&
        !perm.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !perm.key.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !perm.resource.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        continue;
      }
      if (!groups[perm.resource]) {
        groups[perm.resource] = [];
      }
      groups[perm.resource]!.push(perm);
    }
    return groups;
  }, [permissions, searchQuery]);

  const togglePermission = (key: string) => {
    const current = new Set(methods.getValues("permissionKeys") ?? []);
    if (current.has(key)) {
      current.delete(key);
    } else {
      current.add(key);
    }
    methods.setValue("permissionKeys", Array.from(current), { shouldValidate: true });
  };

  const toggleCategory = (categoryPerms: PlatformPermission[]) => {
    const current = new Set(methods.getValues("permissionKeys") ?? []);
    const catKeys = categoryPerms.map((p) => p.key);
    const allSelected = catKeys.every((k) => current.has(k));

    if (allSelected) {
      catKeys.forEach((k) => current.delete(k));
    } else {
      catKeys.forEach((k) => current.add(k));
    }
    methods.setValue("permissionKeys", Array.from(current), { shouldValidate: true });
  };

  const handleSelectAll = () => {
    if (selectedPermissions.length === permissions.length) {
      methods.setValue("permissionKeys", [], { shouldValidate: true });
    } else {
      methods.setValue(
        "permissionKeys",
        permissions.map((p) => p.key),
        { shouldValidate: true },
      );
    }
  };

  const onSubmit = async (values: CreatePlatformRoleInput) => {
    setFormError(null);
    try {
      if (isEdit && roleId) {
        await updateRole({
          id: roleId,
          input: {
            name: values.name.trim(),
            description: values.description?.trim(),
            permissionKeys: values.permissionKeys,
          },
        });
        toast.success(`Role ${values.name} updated successfully!`);
      } else {
        await createRole({
          name: values.name.trim(),
          key: values.key.trim().toUpperCase(),
          description: values.description?.trim(),
          permissionKeys: values.permissionKeys,
        });
        toast.success(`Role ${values.name} created successfully!`);
      }
      router.push("/platform/roles");
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to save platform role"));
    }
  };

  if ((isEdit && rolesLoading) || permsLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (isEdit && !existingRole && !rolesLoading) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-12 text-center">
        <h2 className="text-xl font-bold">Platform Role Not Found</h2>
        <p className="text-muted-foreground text-sm">
          The requested platform role ID does not exist or has been removed.
        </p>
        <Button asChild variant="outline">
          <Link href="/platform/roles">
            <ArrowLeft className="mr-2 size-4" /> Back to Roles & Permissions
          </Link>
        </Button>
      </div>
    );
  }

  const isPending = isCreating || isUpdating;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="size-9 shrink-0">
            <Link href="/platform/roles">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">
                {isEdit
                  ? `Edit Platform Role: ${existingRole?.name}`
                  : "Create Custom Platform Role"}
              </h1>
              {existingRole?.isSystem && (
                <Badge variant="outline" className="gap-1 font-mono text-[10px]">
                  <Lock className="size-2.5" /> System Immutable
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              Configure canonical <code>resource::action</code> permissions governing internal SaaS
              operations.
            </p>
          </div>
        </div>

        <Button asChild variant="ghost" size="sm" className="gap-1.5 self-start sm:self-auto">
          <Link href="/platform/roles">
            <ArrowLeft className="size-3.5" /> Back to Matrix
          </Link>
        </Button>
      </div>

      <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-6">
        {formError && (
          <Alert variant="destructive">
            <ShieldAlert className="size-4" />
            <AlertTitle>Action Failed</AlertTitle>
            <AlertDescription className="text-xs">{formError}</AlertDescription>
          </Alert>
        )}

        {/* Card 1: Role Identity */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Shield className="text-primary size-4" /> Role Identity & Purpose
            </CardTitle>
            <CardDescription className="text-xs">
              General nomenclature and audit reference key.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ControlledInput
                name="name"
                label="Role Name"
                placeholder="e.g. Compliance Auditor"
                required
                disabled={existingRole?.isSystem}
              />

              <ControlledInput
                name="key"
                label="Role Key (Uppercase & Underscores)"
                placeholder="e.g. COMPLIANCE_AUDITOR"
                required
                disabled={isEdit}
                className="font-mono text-xs uppercase"
              />
            </div>

            <ControlledTextarea
              name="description"
              label="Role Description"
              placeholder="e.g. Granted read-only inspection over tenant audit trails, operator logs, and compliance telemetry."
              rows={2}
              className="resize-none text-xs"
              disabled={existingRole?.isSystem}
            />
          </CardContent>
        </Card>

        {/* Card 2: Permission Matrix */}
        <Card className="shadow-xs">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <ShieldCheck className="text-primary size-4" /> Canonical Permissions Matrix
                </CardTitle>
                <CardDescription className="text-xs">
                  Select the granular capabilities granted to platform staff holding this role.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">
                  {selectedPermissions.length} of {permissions.length} Selected
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-8 text-xs"
                  disabled={existingRole?.isSystem}
                >
                  {selectedPermissions.length === permissions.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>
            </div>

            {/* Live Filter Bar */}
            <div className="pt-2">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  placeholder="Filter permissions by name, key, or resource category…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e?.target?.value ?? "")}
                  className="pl-9 text-xs"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {Object.keys(groupedPermissions).length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-xs">
                No permissions match &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              Object.entries(groupedPermissions).map(([resource, perms]) => {
                const catKeys = perms.map((p) => p.key);
                const allCatSelected = catKeys.every((k) => selectedPermissions.includes(k));

                return (
                  <div key={resource} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold tracking-wider uppercase">
                          {resource.replace(/_/g, " ")}
                        </span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {perms.length} {perms.length === 1 ? "Action" : "Actions"}
                        </Badge>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCategory(perms)}
                        className="h-7 text-[11px]"
                        disabled={existingRole?.isSystem}
                      >
                        {allCatSelected ? "Clear Category" : "Select All in Category"}
                      </Button>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {perms.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.key);
                        return (
                          <label
                            key={perm.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-xs transition-colors",
                              isChecked
                                ? "border-primary/40 bg-primary/5 text-foreground"
                                : "border-border/60 bg-card hover:bg-muted/40 text-muted-foreground",
                              existingRole?.isSystem && "cursor-not-allowed opacity-75",
                            )}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => togglePermission(perm.key)}
                              disabled={existingRole?.isSystem}
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-foreground text-xs leading-tight font-semibold">
                                {perm.name}
                              </div>
                              <code className="text-muted-foreground mt-1 block font-mono text-[10px]">
                                {perm.key}
                              </code>
                              {perm.description && (
                                <p className="text-muted-foreground mt-1 line-clamp-2 text-[10px]">
                                  {perm.description}
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-2">
          <Button asChild variant="outline">
            <Link href="/platform/roles">Cancel</Link>
          </Button>

          {!existingRole?.isSystem && (
            <SubmitButton
              pending={isPending}
              pendingText={isEdit ? "Saving Role…" : "Creating Role…"}
            >
              <Check className="mr-2 size-4" />
              {isEdit ? "Save Role Changes" : "Create Platform Role"}
            </SubmitButton>
          )}
        </div>
      </FormWrapper>
    </div>
  );
}
