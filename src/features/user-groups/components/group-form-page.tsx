"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Search, Shield, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ControlledInput, ControlledTextarea, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlatformRoles, useStaffList } from "@/features/platform";
import { DEFAULT_ROLES, useTenantRoles } from "@/features/rbac";
import { useActiveTenant, useTenantMembers, useTenants } from "@/features/tenants";

import {
  useAddPlatformGroupMembers,
  useAddTenantGroupMembers,
  useBindTenantGroupRole,
  useCreatePlatformGroup,
  useCreateTenantGroup,
  usePlatformGroup,
  useTenantGroup,
  useUpdatePlatformGroup,
  useUpdateTenantGroup,
} from "../queries";
import { createGroupSchema, type CreateGroupValues } from "../schemas";
import { formatPermissionsSummary } from "../utils";

interface GroupFormPageProps {
  scope: "TENANT" | "PLATFORM";
  groupId?: string; // If provided, edit mode
  backHref?: string;
}

export function GroupFormPage({ scope, groupId, backHref }: GroupFormPageProps) {
  const router = useRouter();
  const isEdit = Boolean(groupId);

  const isTenant = scope === "TENANT";
  const { activeTenant, activeTenantId: rawTenantId } = useActiveTenant({ enabled: isTenant });
  const activeTenantId = rawTenantId ?? undefined;

  // Queries for edit mode
  const { data: tenantGroup, isLoading: loadingTenantGroup } = useTenantGroup(
    isTenant ? activeTenantId : undefined,
    isTenant ? groupId : undefined,
  );
  const { data: platformGroup, isLoading: loadingPlatformGroup } = usePlatformGroup(
    !isTenant ? groupId : undefined,
  );
  const existingGroup = isTenant ? tenantGroup : platformGroup;
  const isLoadingExisting = isEdit && (isTenant ? loadingTenantGroup : loadingPlatformGroup);

  // Mutations
  const createTenantGroupMutation = useCreateTenantGroup(activeTenantId);
  const updateTenantGroupMutation = useUpdateTenantGroup(activeTenantId);
  const addTenantMembersMutation = useAddTenantGroupMembers(activeTenantId);
  const bindTenantGroupRoleMutation = useBindTenantGroupRole(activeTenantId);

  const createPlatformGroupMutation = useCreatePlatformGroup();
  const updatePlatformGroupMutation = useUpdatePlatformGroup();
  const addPlatformMembersMutation = useAddPlatformGroupMembers();

  const isSaving =
    createTenantGroupMutation.isPending ||
    updateTenantGroupMutation.isPending ||
    createPlatformGroupMutation.isPending ||
    updatePlatformGroupMutation.isPending ||
    addTenantMembersMutation.isPending ||
    addPlatformMembersMutation.isPending ||
    bindTenantGroupRoleMutation.isPending;

  // Candidate members for initial assignment
  const { data: tenantMembers = [] } = useTenantMembers(isTenant ? activeTenantId : undefined);
  const { data: staffData } = useStaffList({ limit: 100 }, { enabled: !isTenant });

  // Resolve active tenant ID with fallback to available tenants list
  const { data: tenantsList = [] } = useTenants({ enabled: isTenant && !activeTenantId });
  const effectiveTenantId = activeTenantId ?? (tenantsList?.[0]?.id || "");

  // Available roles for initial assignment
  const { data: allTenantRoles = [] } = useTenantRoles(isTenant ? effectiveTenantId : undefined);
  const { data: allPlatformRoles = [] } = usePlatformRoles();

  const candidates = useMemo(() => {
    if (scope === "TENANT") {
      return (tenantMembers ?? [])
        .filter((m) => m?.status === "ACTIVE")
        .map((m) => ({
          id: m?.userId ?? m?.id,
          name: m?.name ?? "Unknown",
          email: m?.email ?? "",
        }));
    }
    return (staffData?.items ?? [])
      .filter((s) => s?.status === "ACTIVE")
      .map((s) => ({
        id: s?.id,
        name: s?.displayName ?? "Unknown",
        email: s?.email ?? "",
      }));
  }, [scope, tenantMembers, staffData]);

  // Candidate roles (always populated with safe defaults)
  const candidateRoles = useMemo(() => {
    if (scope === "TENANT") {
      const active = (allTenantRoles ?? []).filter((r) => r.isActive ?? true);
      return active.length > 0 ? active : DEFAULT_ROLES;
    }
    return (allPlatformRoles ?? []).filter((r) => r.isActive ?? true);
  }, [scope, allTenantRoles, allPlatformRoles]);

  // Selected members for initial assignment
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  // Selected roles for initial assignment
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [roleSearch, setRoleSearch] = useState("");

  const filteredCandidates = useMemo(() => {
    if (!memberSearch.trim()) return candidates;
    const term = memberSearch.toLowerCase();
    return candidates.filter(
      (c) => c?.name?.toLowerCase().includes(term) || c?.email?.toLowerCase().includes(term),
    );
  }, [candidates, memberSearch]);

  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return candidateRoles;
    const term = roleSearch.toLowerCase();
    return candidateRoles.filter((r) => {
      const codeOrKey = "code" in r ? r.code : "key" in r ? (r as { key?: string }).key : null;
      return (
        r?.name?.toLowerCase().includes(term) ||
        (codeOrKey && codeOrKey.toLowerCase().includes(term)) ||
        (r?.description && r.description.toLowerCase().includes(term)) ||
        (r?.permissions && r.permissions.some((p) => p.toLowerCase().includes(term)))
      );
    });
  }, [candidateRoles, roleSearch]);

  const formValues = useMemo<CreateGroupValues>(() => {
    if (existingGroup) {
      return {
        name: existingGroup.name,
        slug: existingGroup.slug,
        description: existingGroup.description ?? "",
      };
    }
    return {
      name: "",
      slug: "",
      description: "",
    };
  }, [existingGroup]);

  const methods = useForm<CreateGroupValues>({
    resolver: zodResolver(createGroupSchema),
    values: formValues,
  });

  // Slug auto-generation state
  const [autoSlug, setAutoSlug] = useState(!isEdit);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    methods.setValue("name", val, { shouldValidate: true });
    if (autoSlug && !isEdit) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      methods.setValue("slug", generated, { shouldValidate: true });
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleRole = (id: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const defaultBackHref =
    backHref ??
    (scope === "TENANT"
      ? activeTenant?.slug
        ? `/w/${activeTenant.slug}/groups`
        : "/groups"
      : "/platform/groups");

  const onSubmit = async (values: CreateGroupValues) => {
    try {
      if (isEdit && groupId) {
        if (scope === "TENANT") {
          await updateTenantGroupMutation.mutateAsync({
            groupId,
            input: values,
          });
        } else {
          await updatePlatformGroupMutation.mutateAsync({
            groupId,
            input: values,
          });
        }
        toast.success(`User group "${values.name}" updated successfully.`);
      } else {
        let createdGroup;
        if (scope === "TENANT") {
          createdGroup = await createTenantGroupMutation.mutateAsync(values);
          if (selectedMemberIds.length > 0 && createdGroup?.id) {
            await addTenantMembersMutation.mutateAsync({
              groupId: createdGroup.id,
              userIds: selectedMemberIds,
            });
          }
          if (selectedRoleIds.length > 0 && createdGroup?.id) {
            await bindTenantGroupRoleMutation.mutateAsync({
              groupId: createdGroup.id,
              input: { roleIds: selectedRoleIds },
            });
          }
        } else {
          createdGroup = await createPlatformGroupMutation.mutateAsync(values);
          if (selectedMemberIds.length > 0 && createdGroup?.id) {
            await addPlatformMembersMutation.mutateAsync({
              groupId: createdGroup.id,
              staffIds: selectedMemberIds,
            });
          }
        }
        toast.success(`User group "${values.name}" created successfully.`);
      }

      router.push(defaultBackHref);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save user group. Please try again.";
      toast.error(message);
    }
  };

  if (isLoadingExisting) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild className="gap-2">
          <Link href={defaultBackHref}>
            <ArrowLeft className="h-4 w-4" />
            Back to Groups
          </Link>
        </Button>
        <span className="text-muted-foreground text-sm font-medium">/</span>
        <span className="text-sm font-medium">{isEdit ? "Edit Group" : "New User Group"}</span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? `Edit Group: ${existingGroup?.name}` : "Create User Group"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {scope === "TENANT"
            ? `Organize users within ${activeTenant?.name ?? "your organization"} for bulk workflows and management.`
            : "Organize internal platform operators and staff independently of tenant boundaries."}
        </p>
      </div>

      <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-6">
        {/* Core Details Card */}
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Group Information</CardTitle>
              <Badge variant="outline" className="font-mono text-xs">
                {scope} SCOPE
              </Badge>
            </div>
            <CardDescription>
              Basic identifiers and descriptive details for this user group.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ControlledInput
              name="name"
              label="Group Name"
              placeholder="e.g. Finance Operations, Teaching Staff"
              required
              onChange={handleNameChange}
            />

            <div>
              <ControlledInput
                name="slug"
                label="Group Identifier (Slug)"
                placeholder="e.g. finance-ops"
                description={
                  autoSlug && !isEdit
                    ? "Generated automatically from name. Edit below to override."
                    : "URL-friendly unique key for this group."
                }
                onChange={(e) => {
                  setAutoSlug(false);
                  methods.setValue("slug", e.target.value, { shouldValidate: true });
                }}
              />
            </div>

            <ControlledTextarea
              name="description"
              label="Description (Optional)"
              placeholder="Explain the organizational responsibilities or purpose of this group..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Optional Assignments: Roles & Members in compact 2-column grid */}
        {!isEdit && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Role Assignment Card */}
            <Card className="rounded-2xl border shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Assign Roles (Optional)</CardTitle>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Shield className="h-3 w-3" />
                    {selectedRoleIds.length} selected
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Select {scope === "TENANT" ? "workspace" : "platform staff"} roles. Active members
                  inherit permissions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                  <Input
                    placeholder="Search roles or permissions..."
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    className="h-9 pl-8 text-xs"
                  />
                </div>

                <div className="divide-border max-h-52 divide-y overflow-y-auto rounded-xl border">
                  {filteredRoles.length === 0 ? (
                    <div className="text-muted-foreground p-4 text-center text-xs">
                      {candidateRoles.length === 0
                        ? "No active roles available."
                        : "No roles match your search."}
                    </div>
                  ) : (
                    filteredRoles.map((role) => {
                      const isSelected = selectedRoleIds.includes(role.id);
                      const roleCode =
                        "code" in role
                          ? role.code
                          : "key" in role
                            ? (role as { key?: string }).key
                            : null;
                      return (
                        <div
                          key={role.id}
                          onClick={() => toggleRole(role.id)}
                          className="hover:bg-muted/40 flex cursor-pointer items-start justify-between p-2.5 transition-colors"
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-2.5">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleRole(role.id)}
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-foreground text-xs font-semibold">
                                  {role.name}
                                </span>
                                {roleCode && (
                                  <Badge
                                    variant="outline"
                                    className="px-1 py-0 font-mono text-[9px]"
                                  >
                                    {roleCode}
                                  </Badge>
                                )}
                                {role.isSystem && (
                                  <Badge variant="secondary" className="px-1 py-0 text-[9px]">
                                    System
                                  </Badge>
                                )}
                              </div>
                              {role.description && (
                                <p className="text-muted-foreground line-clamp-1 text-[11px]">
                                  {role.description}
                                </p>
                              )}
                              <div className="text-muted-foreground truncate text-[11px] font-medium">
                                {formatPermissionsSummary(role.permissions)}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Badge
                              variant="outline"
                              className="text-primary ml-1.5 shrink-0 text-[9px]"
                            >
                              Selected
                            </Badge>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Member Assignment Card */}
            <Card className="rounded-2xl border shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Assign Members (Optional)</CardTitle>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Users className="h-3 w-3" />
                    {selectedMemberIds.length} selected
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Select {scope === "TENANT" ? "members" : "staff accounts"} to add upon creation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                  <Input
                    placeholder={`Search by name or email...`}
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="h-9 pl-8 text-xs"
                  />
                </div>

                <div className="divide-border max-h-52 divide-y overflow-y-auto rounded-xl border">
                  {filteredCandidates.length === 0 ? (
                    <div className="text-muted-foreground p-4 text-center text-xs">
                      {candidates.length === 0
                        ? "No active accounts available."
                        : "No accounts match your search."}
                    </div>
                  ) : (
                    filteredCandidates.map((candidate) => {
                      const isSelected = selectedMemberIds.includes(candidate.id);
                      return (
                        <div
                          key={candidate.id}
                          onClick={() => toggleMember(candidate.id)}
                          className="hover:bg-muted/40 flex cursor-pointer items-center justify-between p-2.5 transition-colors"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2.5">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleMember(candidate.id)}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-medium">{candidate.name}</div>
                              <div className="text-muted-foreground truncate text-[11px]">
                                {candidate.email}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Badge
                              variant="outline"
                              className="text-primary ml-1.5 shrink-0 text-[9px]"
                            >
                              Selected
                            </Badge>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" type="button" asChild disabled={isSaving}>
            <Link href={defaultBackHref}>Cancel</Link>
          </Button>
          <SubmitButton
            pending={isSaving}
            pendingText={isEdit ? "Saving..." : "Creating..."}
            className="gap-2"
          >
            {isEdit ? "Save Changes" : "Create User Group"}
          </SubmitButton>
        </div>
      </FormWrapper>
    </div>
  );
}
