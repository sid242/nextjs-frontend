"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Code2,
  FileJson,
  KeyRound,
  Layers,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  ControlledInput,
  ControlledSelect,
  ControlledSwitch,
  ControlledTextarea,
  FormWrapper,
} from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api/errors";

import { useCreatePolicy, usePolicy, useUpdatePolicy } from "../queries";
import { createPolicySchema, type CreatePolicyFormValues } from "../schemas";

const EFFECT_OPTIONS = [
  { label: "ALLOW — Permit Operation when conditions match", value: "allow" },
  { label: "DENY — Explicitly Forbid (Overrides all ALLOW policies)", value: "deny" },
];

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

interface PolicyFormPageProps {
  policyId?: string;
}

export function PolicyFormPage({ policyId }: PolicyFormPageProps) {
  const router = useRouter();
  const params = useParams<{ tenantSlug: string }>();
  const tenantSlug = params?.tenantSlug ?? "";
  const isEditing = Boolean(policyId);

  const [formError, setFormError] = useState<string | null>(null);

  const { data: policy, isLoading: policyLoading } = usePolicy(policyId ?? "");
  const createMutation = useCreatePolicy();
  const updateMutation = useUpdatePolicy();

  const methods = useForm<CreatePolicyFormValues>({
    resolver: zodResolver(createPolicySchema),
    defaultValues: {
      name: "",
      description: "",
      resource: "leads",
      action: "read",
      effect: "allow",
      conditionsJson: JSON.stringify(
        {
          attribute: "resource.assignedMemberId",
          operator: "$eq",
          value: "actor.memberId",
        },
        null,
        2,
      ),
      priority: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (isEditing && policy) {
      methods.reset({
        name: policy.name ?? "",
        description: policy.description ?? "",
        resource: policy.resource ?? "leads",
        action: policy.action ?? "read",
        effect: policy.effect ?? "allow",
        conditionsJson: JSON.stringify(policy.conditions ?? {}, null, 2),
        priority: policy.priority ?? 0,
        isActive: policy.isActive ?? true,
      });
    }
  }, [isEditing, policy, methods]);

  const onSubmit = async (values: CreatePolicyFormValues) => {
    setFormError(null);
    let parsedConditions: Record<string, unknown> = {};
    try {
      parsedConditions = JSON.parse(values.conditionsJson);
    } catch {
      setFormError("Conditions must be valid JSON");
      return;
    }

    try {
      if (isEditing && policyId) {
        await updateMutation.mutateAsync({
          policyId,
          input: {
            name: values.name.trim(),
            description: values.description?.trim() || undefined,
            resource: values.resource.trim(),
            action: values.action.trim(),
            effect: values.effect,
            conditions: parsedConditions,
            priority: Number(values.priority ?? 0),
            isActive: Boolean(values.isActive),
          },
        });
        toast.success(`Policy "${values.name}" updated successfully!`);
      } else {
        await createMutation.mutateAsync({
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          resource: values.resource.trim(),
          action: values.action.trim(),
          effect: values.effect,
          conditions: parsedConditions,
          priority: Number(values.priority ?? 0),
          isActive: Boolean(values.isActive),
        });
        toast.success(`Policy "${values.name}" created successfully!`);
      }
      router.push(`/w/${tenantSlug}/policies`);
    } catch (err: unknown) {
      setFormError(
        getErrorMessage(err, isEditing ? "Failed to update policy" : "Failed to create policy"),
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && policyLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground hover:text-foreground -ml-2 gap-1.5"
          >
            <Link href={`/w/${tenantSlug}/policies`}>
              <ArrowLeft className="h-4 w-4" />
              Back to Policies
            </Link>
          </Button>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            {isEditing ? `Edit Policy: ${policy?.name ?? "Details"}` : "Create Access Policy"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEditing
              ? "Update evaluation conditions, target resources, and effect."
              : "Define dynamic ABAC/PBAC rules evaluated against caller and resource attributes."}
          </p>
        </div>
      </div>

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {/* FormWrapper with Controlled Components */}
      <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-6">
        {/* Card 1: Policy Identification */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Policy Target & Action</CardTitle>
                <CardDescription className="text-xs">
                  Resource identifier, action verb, and authorization effect.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ControlledInput
              control={methods.control}
              name="name"
              label="Policy Name"
              placeholder="e.g. Sales Rep Assigned Leads Scoping"
              required
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ControlledInput
                control={methods.control}
                name="resource"
                label="Resource Domain"
                placeholder="e.g. leads"
                description="Target entity domain (e.g. leads, billing, files)."
                required
              />
              <ControlledInput
                control={methods.control}
                name="action"
                label="Action Verb"
                placeholder="e.g. read, write, or *"
                description="HTTP operation or capability (* for all actions)."
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ControlledSelect
                control={methods.control}
                name="effect"
                label="Policy Effect"
                options={EFFECT_OPTIONS}
                required
              />
              <ControlledInput
                control={methods.control}
                name="priority"
                type="number"
                label="Evaluation Priority"
                placeholder="0"
                description="Higher priority policies evaluate earlier in the chain."
              />
            </div>

            <ControlledTextarea
              control={methods.control}
              name="description"
              label="Policy Description"
              placeholder="Explain the security purpose and business requirements of this rule..."
              rows={2}
            />
          </CardContent>
        </Card>

        {/* Card 2: Attribute Conditions (JSON Tree) */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Code2 className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Condition Expression (JSON)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Attribute expression evaluated dynamically against actor and resource context.
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Presets bar */}
            <div>
              <p className="text-muted-foreground pb-1.5 text-xs font-medium">
                Load Template Preset:
              </p>
              <div className="flex flex-wrap gap-2">
                {CONDITION_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() =>
                      methods.setValue("conditionsJson", preset.value, { shouldValidate: true })
                    }
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <ControlledTextarea
              control={methods.control}
              name="conditionsJson"
              label="Conditions Tree (JSON Object)"
              placeholder='{ "attribute": "resource.assignedMemberId", "operator": "$eq", "value": "actor.memberId" }'
              rows={8}
              className="font-mono text-xs"
              required
            />
          </CardContent>
        </Card>

        {/* Card 3: Activation Status */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="pt-6">
            <ControlledSwitch
              control={methods.control}
              name="isActive"
              label="Enforce Active Policy"
              description="When disabled, this policy is skipped during PBAC evaluation and SQL query scoping."
            />
          </CardContent>
        </Card>

        {/* Form Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" asChild disabled={isPending}>
            <Link href={`/w/${tenantSlug}/policies`}>Cancel</Link>
          </Button>
          <SubmitButton
            pending={isPending}
            pendingText={isEditing ? "Updating Policy..." : "Creating Policy..."}
          >
            {isEditing ? "Update Policy" : "Create Policy"}
          </SubmitButton>
        </div>
      </FormWrapper>
    </div>
  );
}
