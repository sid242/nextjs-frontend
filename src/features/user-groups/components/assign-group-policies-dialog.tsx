"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Search, ShieldCheck } from "lucide-react";
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
import { usePlatformPolicies } from "@/features/platform";
import { usePolicies, type Policy } from "@/features/policies";

import { useBindPlatformGroupPolicy, useBindTenantGroupPolicy } from "../queries";

interface AssignGroupPoliciesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  scope?: "TENANT" | "PLATFORM";
  tenantId?: string;
  alreadyBoundPolicyIds: string[];
}

interface PolicyChecklistProps {
  policies: Policy[];
  isLoading: boolean;
  scopeLabel: string;
  search: string;
  setSearch: (value: string) => void;
  reason: string;
  setReason: (value: string) => void;
  selectedPolicyIds: string[];
  alreadyBoundPolicyIds: string[];
  onTogglePolicy: (policyId: string) => void;
  onSelectAll: (ids: string[]) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
  groupName: string;
}

function PolicyChecklistBody({
  policies,
  isLoading,
  scopeLabel,
  search,
  setSearch,
  reason,
  setReason,
  selectedPolicyIds,
  alreadyBoundPolicyIds,
  onTogglePolicy,
  onSelectAll,
  onCancel,
  onConfirm,
  isPending,
  groupName,
}: PolicyChecklistProps) {
  const boundIdSet = useMemo(() => new Set(alreadyBoundPolicyIds), [alreadyBoundPolicyIds]);

  const availablePolicies = useMemo(
    () => policies.filter((p) => (p.isActive ?? true) && !boundIdSet.has(p.id)),
    [policies, boundIdSet],
  );

  const filteredPolicies = useMemo(() => {
    if (!search.trim()) return availablePolicies;
    const term = search.toLowerCase();
    return availablePolicies.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.resource.toLowerCase().includes(term) ||
        p.action.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term)),
    );
  }, [availablePolicies, search]);

  return (
    <>
      <DialogHeader className="border-b px-6 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-lg">Assign Policies to Group</DialogTitle>
            <DialogDescription className="text-xs">
              Bind {scopeLabel} PBAC policies directly to active members of{" "}
              <strong>{groupName}</strong>.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-3 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search available policies, resources, or actions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-xs"
            />
          </div>
          {filteredPolicies.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onSelectAll(
                  selectedPolicyIds.length === filteredPolicies.length
                    ? []
                    : filteredPolicies.map((p) => p.id),
                )
              }
              className="h-9 text-xs"
            >
              {selectedPolicyIds.length === filteredPolicies.length ? "Deselect All" : "Select All"}
            </Button>
          )}
        </div>

        <div className="divide-border max-h-[340px] divide-y overflow-y-auto rounded-xl border">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : availablePolicies.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center text-xs">
              All active {scopeLabel} policies are already bound to this group.
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center text-xs">
              No policies match your search term.
            </div>
          ) : (
            filteredPolicies.map((policy) => {
              const isSelected = selectedPolicyIds.includes(policy.id);
              const isDeny = policy.effect === "deny";
              return (
                <div
                  key={policy.id}
                  onClick={() => onTogglePolicy(policy.id)}
                  className={`flex cursor-pointer items-start gap-3 p-3.5 transition-colors ${
                    isSelected ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-muted/40"
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onTogglePolicy(policy.id)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-foreground text-sm font-semibold">{policy.name}</span>
                      <Badge
                        variant="outline"
                        className={
                          isDeny
                            ? "border-red-500/40 bg-red-50 font-mono text-[10px] text-red-700 uppercase dark:bg-red-950/30 dark:text-red-400"
                            : "border-emerald-500/40 bg-emerald-50 font-mono text-[10px] text-emerald-700 uppercase dark:bg-emerald-950/30 dark:text-emerald-400"
                        }
                      >
                        {policy.effect}
                      </Badge>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {policy.resource}:{policy.action}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        P:{policy.priority}
                      </Badge>
                    </div>
                    {policy.description && (
                      <p className="text-muted-foreground line-clamp-1 text-xs">
                        {policy.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Input
          placeholder="Reason for binding (optional, e.g. Regional compliance cohort)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="h-8 text-xs"
          maxLength={255}
        />
      </div>

      <DialogFooter className="bg-muted/30 border-t px-6 py-3">
        <div className="flex w-full items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium">
            {selectedPolicyIds.length === 0
              ? "No policies selected"
              : `${selectedPolicyIds.length} ${selectedPolicyIds.length === 1 ? "policy" : "policies"} selected`}
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={selectedPolicyIds.length === 0 || isPending}
              onClick={onConfirm}
              className="gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Binding…
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Bind {selectedPolicyIds.length > 0 ? selectedPolicyIds.length : ""} Policy
                  {selectedPolicyIds.length === 1 ? "" : "s"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogFooter>
    </>
  );
}

function TenantPoliciesModalContent(props: AssignGroupPoliciesDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);
  const [reason, setReason] = useState("");

  const { data, isLoading } = usePolicies({ limit: 100 });
  const bindMutation = useBindTenantGroupPolicy(props.tenantId);

  const handleClose = () => {
    setSelectedPolicyIds([]);
    setSearch("");
    setReason("");
    props.onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (selectedPolicyIds.length === 0) return;
    try {
      await bindMutation.mutateAsync({
        groupId: props.groupId,
        input: {
          policyIds: selectedPolicyIds,
          reason: reason.trim() ? reason.trim() : undefined,
        },
      });
      toast.success(
        `Successfully bound ${selectedPolicyIds.length} ${selectedPolicyIds.length === 1 ? "policy" : "policies"} to "${props.groupName}".`,
      );
      handleClose();
    } catch {
      toast.error("Failed to bind policies to user group.");
    }
  };

  return (
    <PolicyChecklistBody
      policies={data?.items ?? []}
      isLoading={isLoading}
      scopeLabel="workspace"
      search={search}
      setSearch={setSearch}
      reason={reason}
      setReason={setReason}
      selectedPolicyIds={selectedPolicyIds}
      alreadyBoundPolicyIds={props.alreadyBoundPolicyIds}
      onTogglePolicy={(id) =>
        setSelectedPolicyIds((prev) =>
          prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
        )
      }
      onSelectAll={setSelectedPolicyIds}
      onCancel={handleClose}
      onConfirm={handleConfirm}
      isPending={bindMutation.isPending}
      groupName={props.groupName}
    />
  );
}

function PlatformPoliciesModalContent(props: AssignGroupPoliciesDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);
  const [reason, setReason] = useState("");

  const { data, isLoading } = usePlatformPolicies({ limit: 100 });
  const bindMutation = useBindPlatformGroupPolicy();

  const handleClose = () => {
    setSelectedPolicyIds([]);
    setSearch("");
    setReason("");
    props.onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (selectedPolicyIds.length === 0) return;
    try {
      await bindMutation.mutateAsync({
        groupId: props.groupId,
        input: {
          policyIds: selectedPolicyIds,
          reason: reason.trim() ? reason.trim() : undefined,
        },
      });
      toast.success(
        `Successfully bound ${selectedPolicyIds.length} ${selectedPolicyIds.length === 1 ? "policy" : "policies"} to "${props.groupName}".`,
      );
      handleClose();
    } catch {
      toast.error("Failed to bind policies to platform group.");
    }
  };

  return (
    <PolicyChecklistBody
      policies={(data?.items as Policy[]) ?? []}
      isLoading={isLoading}
      scopeLabel="platform"
      search={search}
      setSearch={setSearch}
      reason={reason}
      setReason={setReason}
      selectedPolicyIds={selectedPolicyIds}
      alreadyBoundPolicyIds={props.alreadyBoundPolicyIds}
      onTogglePolicy={(id) =>
        setSelectedPolicyIds((prev) =>
          prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
        )
      }
      onSelectAll={setSelectedPolicyIds}
      onCancel={handleClose}
      onConfirm={handleConfirm}
      isPending={bindMutation.isPending}
      groupName={props.groupName}
    />
  );
}

export function AssignGroupPoliciesDialog(props: AssignGroupPoliciesDialogProps) {
  const isTenant = (props.scope ?? "TENANT") === "TENANT";
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0 sm:rounded-2xl">
        {props.open ? (
          isTenant ? (
            <TenantPoliciesModalContent {...props} />
          ) : (
            <PlatformPoliciesModalContent {...props} />
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
