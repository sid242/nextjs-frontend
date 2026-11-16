"use client";

import { useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { useCreatePolicy, useUpdatePolicy } from "../queries";
import type { Policy, PolicyEffect } from "../types";

const CONDITION_PRESETS = [
  {
    label: "Sales Rep: My Assigned Leads",
    value: JSON.stringify(
      {
        attribute: "resource.assignedMemberId",
        operator: "$eq",
        value: "actor.memberId",
      },
      null,
      2,
    ),
  },
  {
    label: "Manager: Department Leads",
    value: JSON.stringify(
      {
        attribute: "resource.departmentId",
        operator: "$eq",
        value: "actor.departmentId",
      },
      null,
      2,
    ),
  },
  {
    label: "Security: Deny Confidential Records",
    value: JSON.stringify(
      {
        attribute: "resource.isConfidential",
        operator: "$eq",
        value: true,
      },
      null,
      2,
    ),
  },
  {
    label: "Unconditional Full Access",
    value: JSON.stringify({}, null, 2),
  },
];

interface PolicyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy?: Policy | null;
}

function PolicyFormInner({ policy, onClose }: { policy?: Policy | null; onClose: () => void }) {
  const isEditing = Boolean(policy);
  const createMutation = useCreatePolicy();
  const updateMutation = useUpdatePolicy();

  const [name, setName] = useState(policy?.name ?? "");
  const [description, setDescription] = useState(policy?.description ?? "");
  const [resource, setResource] = useState(policy?.resource ?? "leads");
  const [action, setAction] = useState(policy?.action ?? "read");
  const [effect, setEffect] = useState<PolicyEffect>(policy?.effect ?? "allow");
  const [conditionsJson, setConditionsJson] = useState(
    JSON.stringify(policy?.conditions ?? {}, null, 2),
  );
  const [priority, setPriority] = useState<number>(policy?.priority ?? 0);
  const [isActive, setIsActive] = useState<boolean>(policy?.isActive ?? true);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJsonError(null);

    let parsedConditions: Record<string, unknown>;
    try {
      parsedConditions = JSON.parse(conditionsJson);
    } catch {
      setJsonError("Conditions must be valid JSON");
      return;
    }

    try {
      if (isEditing && policy) {
        await updateMutation.mutateAsync({
          policyId: policy.id,
          input: {
            name,
            description: description || undefined,
            resource,
            action,
            effect,
            conditions: parsedConditions,
            priority,
            isActive,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name,
          description: description || undefined,
          resource,
          action,
          effect,
          conditions: parsedConditions,
          priority,
          isActive,
        });
      }
      onClose();
    } catch {
      // Handled by toast/mutation
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="policy-name">Policy Name</Label>
          <Input
            id="policy-name"
            placeholder="e.g. Sales Rep Lead Ownership"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="policy-effect">Effect</Label>
          <Select value={effect} onValueChange={(val: PolicyEffect) => setEffect(val)}>
            <SelectTrigger id="policy-effect">
              <SelectValue placeholder="Select effect" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allow">Allow</SelectItem>
              <SelectItem value="deny">Deny (Overrides Allow)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="policy-resource">Resource</Label>
          <Input
            id="policy-resource"
            placeholder="leads"
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="policy-action">Action</Label>
          <Input
            id="policy-action"
            placeholder="read, update, *"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="policy-priority">Priority</Label>
          <Input
            id="policy-priority"
            type="number"
            placeholder="0"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="policy-desc">Description</Label>
        <Input
          id="policy-desc"
          placeholder="Optional summary of this policy rule"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="policy-conditions">Condition Rules (JSON)</Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Load Preset:</span>
            <select
              className="bg-muted/50 rounded border px-2 py-1 text-xs"
              onChange={(e) => {
                if (e.target.value) {
                  setConditionsJson(e.target.value);
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>
                Choose preset...
              </option>
              {CONDITION_PRESETS.map((p) => (
                <option key={p.label} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Textarea
          id="policy-conditions"
          className="min-h-[140px] font-mono text-xs"
          placeholder="Condition tree JSON..."
          value={conditionsJson}
          onChange={(e) => setConditionsJson(e.target.value)}
        />
        {jsonError ? (
          <p className="text-destructive text-xs">{jsonError}</p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Supports dynamic variables like &quot;actor.memberId&quot; and operators like $eq, $in,
            $gt.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="policy-active">Active Status</Label>
          <p className="text-muted-foreground text-xs">
            Enabled policies are actively evaluated on every API request.
          </p>
        </div>
        <Switch id="policy-active" checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !name}>
          {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Policy"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PolicyFormDialog({ open, onOpenChange, policy }: PolicyFormDialogProps) {
  const isEditing = Boolean(policy);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Access Policy" : "Create Access Policy"}</DialogTitle>
          <DialogDescription>
            Define fine-grained attribute conditions and precedence for workspace resources.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <PolicyFormInner
            key={policy?.id ?? "new"}
            policy={policy}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
