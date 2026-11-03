"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Search, Users } from "lucide-react";
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
import { useStaffList } from "@/features/platform";
import { useActiveTenant, useTenantMembers } from "@/features/tenants";

import {
  useAddPlatformGroupMembers,
  useAddTenantGroupMembers,
  useCreatePlatformGroup,
  useCreateTenantGroup,
  usePlatformGroup,
  useTenantGroup,
  useUpdatePlatformGroup,
  useUpdateTenantGroup,
} from "../queries";
import { createGroupSchema, type CreateGroupValues } from "../schemas";

interface GroupFormPageProps {
  scope: "TENANT" | "PLATFORM";
  groupId?: string; // If provided, edit mode
  backHref?: string;
}

export function GroupFormPage({ scope, groupId, backHref }: GroupFormPageProps) {
  const router = useRouter();
  const isEdit = Boolean(groupId);

  const { activeTenant, activeTenantId: rawTenantId } = useActiveTenant();
  const activeTenantId = rawTenantId ?? undefined;

  // Queries for edit mode
  const { data: tenantGroup, isLoading: loadingTenantGroup } = useTenantGroup(
    activeTenantId,
    scope === "TENANT" ? groupId : undefined,
  );
  const { data: platformGroup, isLoading: loadingPlatformGroup } = usePlatformGroup(
    scope === "PLATFORM" ? groupId : undefined,
  );
  const existingGroup = scope === "TENANT" ? tenantGroup : platformGroup;
  const isLoadingExisting =
    isEdit && (scope === "TENANT" ? loadingTenantGroup : loadingPlatformGroup);

  // Mutations
  const createTenantGroupMutation = useCreateTenantGroup(activeTenantId);
  const updateTenantGroupMutation = useUpdateTenantGroup(activeTenantId);
  const addTenantMembersMutation = useAddTenantGroupMembers(activeTenantId);

  const createPlatformGroupMutation = useCreatePlatformGroup();
  const updatePlatformGroupMutation = useUpdatePlatformGroup();
  const addPlatformMembersMutation = useAddPlatformGroupMembers();

  const isSaving =
    createTenantGroupMutation.isPending ||
    updateTenantGroupMutation.isPending ||
    createPlatformGroupMutation.isPending ||
    updatePlatformGroupMutation.isPending ||
    addTenantMembersMutation.isPending ||
    addPlatformMembersMutation.isPending;

  // Candidate members for initial assignment
  const { data: tenantMembers = [] } = useTenantMembers(
    scope === "TENANT" ? activeTenantId : undefined,
  );
  const { data: staffData } = useStaffList(scope === "PLATFORM" ? { limit: 100 } : undefined);

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

  // Selected members for initial assignment
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  const filteredCandidates = useMemo(() => {
    if (!memberSearch.trim()) return candidates;
    const term = memberSearch.toLowerCase();
    return candidates.filter(
      (c) => c?.name?.toLowerCase().includes(term) || c?.email?.toLowerCase().includes(term),
    );
  }, [candidates, memberSearch]);

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
    <div className="mx-auto max-w-4xl space-y-6">
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

        {/* Member Assignment Card (for create mode) */}
        {!isEdit && (
          <Card className="rounded-2xl border shadow-xs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Assign Initial Members (Optional)</CardTitle>
                  <CardDescription>
                    Select accounts to add to this group upon creation.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {selectedMemberIds.length} selected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder={`Search ${scope === "TENANT" ? "workspace members" : "platform staff"} by name or email...`}
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>

              <div className="divide-border max-h-60 divide-y overflow-y-auto rounded-xl border">
                {filteredCandidates.length === 0 ? (
                  <div className="text-muted-foreground p-6 text-center text-sm">
                    {candidates.length === 0
                      ? "No active members available for assignment."
                      : "No members matched your search."}
                  </div>
                ) : (
                  filteredCandidates.map((candidate) => {
                    const isSelected = selectedMemberIds.includes(candidate.id);
                    return (
                      <div
                        key={candidate.id}
                        onClick={() => toggleMember(candidate.id)}
                        className="hover:bg-muted/40 flex cursor-pointer items-center justify-between p-3 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleMember(candidate.id)}
                          />
                          <div>
                            <div className="text-sm font-medium">{candidate.name}</div>
                            <div className="text-muted-foreground text-xs">{candidate.email}</div>
                          </div>
                        </div>
                        {isSelected && (
                          <Badge variant="outline" className="text-primary text-[10px]">
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
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3">
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
