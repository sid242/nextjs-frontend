"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Code2, Play, Shield, ShieldAlert, Sparkles } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api/errors";

import {
  useCreatePolicy,
  useDryRunEvaluatePolicy,
  usePolicy,
  usePolicyRegistry,
  useUpdatePolicy,
} from "../queries";
import { createPolicySchema, type CreatePolicyFormValues } from "../schemas";
import type { EvaluationResult } from "../types";

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
    value: JSON.stringify({ always: true }, null, 2),
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

  // Dry-run simulation state
  const [testRecordJson, setTestRecordJson] = useState(
    JSON.stringify({ departmentId: "SALES", isConfidential: false }, null, 2),
  );
  const [testActorJson, setTestActorJson] = useState(
    JSON.stringify(
      { departmentId: "SALES", memberId: "member_123", roleKeys: ["SALES_REP"] },
      null,
      2,
    ),
  );
  const [dryRunResult, setDryRunResult] = useState<EvaluationResult | null>(null);
  const [dryRunError, setDryRunError] = useState<string | null>(null);

  const { data: registry, isLoading: isRegistryLoading } = usePolicyRegistry();
  const { data: policy, isLoading: policyLoading } = usePolicy(policyId ?? "");
  const createMutation = useCreatePolicy();
  const updateMutation = useUpdatePolicy();
  const dryRunMutation = useDryRunEvaluatePolicy();

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

  const selectedResource = methods.watch("resource");

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

  // Derived options from backend registry
  const resourceOptions = (registry?.resources ?? []).map((r) => ({
    label: `${r.displayName} (${r.resource})`,
    value: r.resource,
  }));
  if (resourceOptions.length > 0 && !resourceOptions.some((o) => o.value === "*")) {
    resourceOptions.push({ label: "All Resources (*)", value: "*" });
  }

  const currentResourceDef = (registry?.resources ?? []).find(
    (r) => r.resource === selectedResource,
  );
  const actionOptions = (
    currentResourceDef?.actions ?? ["read", "create", "update", "delete", "*"]
  ).map((a) => ({
    label: a === "*" ? "All Actions (*)" : a,
    value: a,
  }));

  const availableAttributes = [
    ...(currentResourceDef?.attributes ?? []),
    ...(registry?.commonActorAttributes ?? []),
    ...(registry?.commonEnvAttributes ?? []),
  ];

  const handleTestPolicy = async () => {
    setDryRunError(null);
    setDryRunResult(null);

    let parsedConditions: Record<string, unknown> = {};
    let parsedRecord: Record<string, unknown> = {};
    let parsedActor: Record<string, unknown> = {};

    try {
      parsedConditions = JSON.parse(methods.getValues("conditionsJson"));
    } catch {
      setDryRunError("Condition expression must be valid JSON before running test");
      return;
    }

    try {
      parsedRecord = JSON.parse(testRecordJson);
    } catch {
      setDryRunError("Test Record must be valid JSON");
      return;
    }

    try {
      parsedActor = JSON.parse(testActorJson);
    } catch {
      setDryRunError("Test Actor Context must be valid JSON");
      return;
    }

    try {
      const res = await dryRunMutation.mutateAsync({
        resource: methods.getValues("resource"),
        action: methods.getValues("action"),
        conditions: parsedConditions,
        record: parsedRecord,
        actor: {
          departmentId: (parsedActor.departmentId as string) || null,
          regionId: (parsedActor.regionId as string) || null,
          memberId: (parsedActor.memberId as string) || undefined,
          userId: (parsedActor.userId as string) || undefined,
          roleKeys: Array.isArray(parsedActor.roleKeys) ? (parsedActor.roleKeys as string[]) : [],
        },
      });
      setDryRunResult(res);
    } catch (err: unknown) {
      setDryRunError(getErrorMessage(err, "Failed to evaluate policy dry run"));
    }
  };

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
              : "Define dynamic ABAC/PBAC rules driven by registered schema attributes."}
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
                  Registry-validated resource domain, action verb, and authorization effect.
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
              {resourceOptions.length > 0 ? (
                <ControlledSelect
                  control={methods.control}
                  name="resource"
                  label="Resource Domain"
                  options={resourceOptions}
                  disabled={isRegistryLoading}
                  required
                />
              ) : (
                <ControlledInput
                  control={methods.control}
                  name="resource"
                  label="Resource Domain"
                  placeholder="e.g. leads"
                  required
                />
              )}

              <ControlledSelect
                control={methods.control}
                name="action"
                label="Action Verb"
                options={actionOptions}
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
          <CardContent className="space-y-4">
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

            {/* Available Attributes from Registry */}
            {availableAttributes.length > 0 && (
              <div className="border-border/60 bg-muted/20 space-y-1.5 rounded-xl border p-3">
                <div className="text-foreground flex items-center gap-1.5 text-xs font-medium">
                  <Sparkles className="h-3 w-3 text-indigo-500" />
                  Available Schema Attributes for {selectedResource}:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableAttributes.map((attr) => (
                    <Badge
                      key={attr.path}
                      variant="outline"
                      className="hover:bg-muted/80 cursor-pointer font-mono text-[11px] transition-colors"
                      title={`${attr.name} (${attr.type}) - ${attr.description}`}
                      onClick={() => {
                        const snippet = `"${attr.path}"`;
                        navigator.clipboard?.writeText?.(attr.path);
                        toast.info(`Copied ${snippet} to clipboard`);
                      }}
                    >
                      {attr.path}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

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

        {/* Card 3: Test Policy Panel (Dry-Run Simulation) */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Play className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Test Policy (Dry-Run)</CardTitle>
                  <CardDescription className="text-xs">
                    Simulate evaluation against mock caller and resource data without persisting.
                  </CardDescription>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleTestPolicy}
                disabled={dryRunMutation.isPending}
              >
                <Play className="h-3.5 w-3.5 text-blue-500" />
                {dryRunMutation.isPending ? "Evaluating..." : "Run Test"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {dryRunError && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription className="text-xs">{dryRunError}</AlertDescription>
              </Alert>
            )}

            {dryRunResult && (
              <div
                className={`space-y-2 rounded-xl border p-3.5 ${
                  dryRunResult.allowed
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {dryRunResult.allowed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-red-600" />
                    )}
                    Evaluation Decision:{" "}
                    <Badge
                      variant={dryRunResult.allowed ? "default" : "destructive"}
                      className="font-mono text-[10px] uppercase"
                    >
                      {dryRunResult.allowed ? "ALLOWED" : "DENIED"}
                    </Badge>
                  </div>
                  <span className="font-mono text-[11px] opacity-80">
                    Effect: {dryRunResult.effect}
                  </span>
                </div>

                {dryRunResult.traces && dryRunResult.traces.length > 0 && (
                  <div className="border-border/30 space-y-1 border-t pt-1 font-mono text-[11px]">
                    {dryRunResult.traces.map((trace, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{trace.policyName}</span>
                        <span>{trace.reason ?? (trace.matched ? "Matched" : "Not matched")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-muted-foreground text-xs font-medium">
                  Sample Target Record (JSON)
                </label>
                <textarea
                  value={testRecordJson}
                  onChange={(e) => setTestRecordJson(e.target.value)}
                  rows={4}
                  className="border-input focus-visible:ring-ring w-full rounded-md border bg-transparent px-3 py-1 font-mono text-xs shadow-xs focus-visible:ring-1 focus-visible:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground text-xs font-medium">
                  Sample Actor Context (JSON)
                </label>
                <textarea
                  value={testActorJson}
                  onChange={(e) => setTestActorJson(e.target.value)}
                  rows={4}
                  className="border-input focus-visible:ring-ring w-full rounded-md border bg-transparent px-3 py-1 font-mono text-xs shadow-xs focus-visible:ring-1 focus-visible:outline-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Activation Status */}
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
