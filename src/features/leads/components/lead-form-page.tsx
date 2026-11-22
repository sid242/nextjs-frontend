"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, DollarSign, Lock, Shield, User } from "lucide-react";
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
import { TENANT_PATHS } from "@/config/routes";
import { getErrorMessage } from "@/lib/api/errors";
import { useTenantHref } from "@/lib/tenancy";

import { useCreateLead, useLead, useUpdateLead } from "../queries";
import { createLeadSchema, type CreateLeadFormValues } from "../schemas";

const STATUS_OPTIONS = [
  { label: "New Lead", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Proposal Sent", value: "proposal" },
  { label: "Closed Won", value: "won" },
  { label: "Closed Lost", value: "lost" },
];

const DEPARTMENT_OPTIONS = [
  { label: "Enterprise Sales", value: "sales-enterprise" },
  { label: "SMB Sales", value: "sales-smb" },
  { label: "Inbound SDR", value: "sales-inbound" },
  { label: "Strategic Accounts", value: "strategic-accounts" },
];

const REGION_OPTIONS = [
  { label: "North America (NA)", value: "na" },
  { label: "Asia-Pacific (APAC)", value: "apac" },
  { label: "Europe & Middle East (EMEA)", value: "emea" },
  { label: "Latin America (LATAM)", value: "latam" },
  { label: "Global", value: "global" },
];

interface LeadFormPageProps {
  leadId?: string;
}

export function LeadFormPage({ leadId }: LeadFormPageProps) {
  const router = useRouter();
  const tenantHref = useTenantHref();
  const isEditing = Boolean(leadId);

  const [formError, setFormError] = useState<string | null>(null);

  const { data: lead, isLoading: leadLoading } = useLead(leadId ?? "");
  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();

  const methods = useForm<CreateLeadFormValues>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "new",
      value: 0,
      departmentId: "sales-enterprise",
      regionId: "apac",
      assignedMemberId: "",
      isConfidential: false,
      notes: "",
    },
  });

  // Reset form once lead data is loaded in edit mode
  useEffect(() => {
    if (isEditing && lead) {
      methods.reset({
        name: lead.name ?? "",
        email: lead.email ?? "",
        phone: lead.phone ?? "",
        company: lead.company ?? "",
        status: lead.status ?? "new",
        value: lead.value ?? 0,
        departmentId: lead.departmentId ?? "sales-enterprise",
        regionId: lead.regionId ?? "apac",
        assignedMemberId: lead.assignedMemberId ?? "",
        isConfidential: lead.isConfidential ?? false,
        notes: lead.notes ?? "",
      });
    }
  }, [isEditing, lead, methods]);

  const onSubmit = async (values: CreateLeadFormValues) => {
    setFormError(null);
    try {
      if (isEditing && leadId) {
        await updateMutation.mutateAsync({
          leadId,
          input: {
            name: values.name.trim(),
            email: values.email.trim(),
            phone: values.phone?.trim() || undefined,
            company: values.company?.trim() || undefined,
            status: values.status,
            value: Number(values.value ?? 0),
            departmentId: values.departmentId || undefined,
            regionId: values.regionId || undefined,
            assignedMemberId: values.assignedMemberId?.trim() || null,
            isConfidential: Boolean(values.isConfidential),
            notes: values.notes?.trim() || undefined,
          },
        });
        toast.success(`Lead "${values.name}" updated successfully!`);
      } else {
        await createMutation.mutateAsync({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone?.trim() || undefined,
          company: values.company?.trim() || undefined,
          status: values.status,
          value: Number(values.value ?? 0),
          departmentId: values.departmentId || undefined,
          regionId: values.regionId || undefined,
          assignedMemberId: values.assignedMemberId?.trim() || undefined,
          isConfidential: Boolean(values.isConfidential),
          notes: values.notes?.trim() || undefined,
        });
        toast.success(`Lead "${values.name}" created successfully!`);
      }
      router.push(tenantHref(TENANT_PATHS.LEADS));
    } catch (err: unknown) {
      setFormError(
        getErrorMessage(err, isEditing ? "Failed to update CRM lead" : "Failed to create CRM lead"),
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && leadLoading) {
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
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground hover:text-foreground -ml-2 gap-1.5"
          >
            <Link href={tenantHref(TENANT_PATHS.LEADS)}>
              <ArrowLeft className="h-4 w-4" />
              Back to CRM Leads
            </Link>
          </Button>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            {isEditing ? `Edit Lead: ${lead?.name ?? "Details"}` : "Create New CRM Lead"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEditing
              ? "Update pipeline status, deal value, or confidentiality scope."
              : "Capture a customer lead subject to fine-grained Policy-Based Access Control (PBAC)."}
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
        {/* Card 1: Contact Information */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <User className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Contact Details</CardTitle>
                <CardDescription className="text-xs">
                  Primary stakeholder name, email address, phone, and organization.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ControlledInput
              control={methods.control}
              name="name"
              label="Contact Full Name"
              placeholder="e.g. Jane Doe"
              required
            />
            <ControlledInput
              control={methods.control}
              name="email"
              type="email"
              label="Business Email"
              placeholder="e.g. jane@acme.com"
              required
            />
            <ControlledInput
              control={methods.control}
              name="company"
              label="Company / Organization"
              placeholder="e.g. Acme Corporation"
            />
            <ControlledInput
              control={methods.control}
              name="phone"
              label="Direct Phone Number"
              placeholder="e.g. +1 (555) 019-2834"
            />
          </CardContent>
        </Card>

        {/* Card 2: Deal & Pipeline Parameters */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Sales Pipeline & Value</CardTitle>
                <CardDescription className="text-xs">
                  Lifecycle stage, contract value, and sales routing attributes.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ControlledSelect
              control={methods.control}
              name="status"
              label="Pipeline Status"
              options={STATUS_OPTIONS}
              required
            />
            <ControlledInput
              control={methods.control}
              name="value"
              type="number"
              label="Deal Value (USD $)"
              placeholder="0"
            />
            <ControlledSelect
              control={methods.control}
              name="departmentId"
              label="Assigned Department"
              options={DEPARTMENT_OPTIONS}
            />
            <ControlledSelect
              control={methods.control}
              name="regionId"
              label="Geographical Region"
              options={REGION_OPTIONS}
            />
          </CardContent>
        </Card>

        {/* Card 3: Ownership & Policy Constraints */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Ownership & Access Governance
                </CardTitle>
                <CardDescription className="text-xs">
                  Attribute matching used by dynamic PBAC rules (assigned rep & confidentiality).
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ControlledInput
              control={methods.control}
              name="assignedMemberId"
              label="Assigned Team Member (User / Member UUID)"
              placeholder="e.g. 11111111-1111-1111-1111-111111111111"
              description="Policy condition 'actor.memberId == resource.assignedMemberId' evaluates against this field."
            />

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <ControlledSwitch
                    control={methods.control}
                    name="isConfidential"
                    label="Confidential Record (Strict Security Policy)"
                    description="When enabled, only actors holding policies that permit confidential records can view or edit this lead."
                  />
                </div>
              </div>
            </div>

            <ControlledTextarea
              control={methods.control}
              name="notes"
              label="Internal Deal Notes"
              placeholder="Add key context, customer requirements, or competitor insights..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Form Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" asChild disabled={isPending}>
            <Link href={tenantHref(TENANT_PATHS.LEADS)}>Cancel</Link>
          </Button>
          <SubmitButton
            pending={isPending}
            pendingText={isEditing ? "Updating Lead..." : "Creating Lead..."}
          >
            {isEditing ? "Update CRM Lead" : "Create CRM Lead"}
          </SubmitButton>
        </div>
      </FormWrapper>
    </div>
  );
}
