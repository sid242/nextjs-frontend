"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound, Shield, ShieldAlert, User, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ControlledInput, ControlledSelect, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api/errors";

import { useCreateStaff, usePlatformRoles } from "../queries";
import { createStaffSchema, type CreateStaffInput } from "../schemas";

export function StaffFormPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const { data: roles = [], isLoading: rolesLoading } = usePlatformRoles();
  const { mutateAsync: createStaff, isPending } = useCreateStaff();

  const methods = useForm<CreateStaffInput>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      roleId: "",
    },
  });

  const roleOptions = useMemo(
    () => roles?.map((r) => ({ label: `${r.name} (${r.key})`, value: r.id })) ?? [],
    [roles],
  );

  const onSubmit = async (values: CreateStaffInput) => {
    setFormError(null);
    try {
      await createStaff({
        displayName: values.displayName.trim(),
        email: values.email.trim(),
        password: values.password,
        roleId: values.roleId,
      });
      toast.success(`Platform staff operator ${values.displayName} provisioned successfully!`);
      router.push("/platform/staff");
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to provision platform staff member"));
    }
  };

  if (rolesLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="size-9 shrink-0">
            <Link href="/platform/staff">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Provision Platform Staff Member</h1>
              <Badge variant="secondary" className="font-mono text-[10px]">
                Internal Staff
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              Staff members operate across the internal SaaS control plane with canonical role-based
              permissions.
            </p>
          </div>
        </div>

        <Button asChild variant="ghost" size="sm" className="gap-1.5 self-start sm:self-auto">
          <Link href="/platform/staff">
            <ArrowLeft className="size-3.5" /> Back to Directory
          </Link>
        </Button>
      </div>

      <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-6">
        {formError && (
          <Alert variant="destructive">
            <ShieldAlert className="size-4" />
            <AlertTitle>Provisioning Error</AlertTitle>
            <AlertDescription className="text-xs">{formError}</AlertDescription>
          </Alert>
        )}

        {/* Card 1: Identity & Credentials */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <User className="text-primary size-4" /> Operator Identity
            </CardTitle>
            <CardDescription className="text-xs">
              Personal name and primary work credentials for internal operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ControlledInput
                name="displayName"
                label="Full Display Name"
                placeholder="e.g. Jane Operator"
                required
              />

              <ControlledInput
                name="email"
                label="Corporate Work Email"
                type="email"
                placeholder="e.g. jane@platform.io"
                required
              />
            </div>

            <div className="space-y-1.5">
              <ControlledInput
                name="password"
                label="Initial Temporary Password"
                type="password"
                placeholder="Minimum 8 characters with numbers & symbols"
                required
              />
              <p className="text-muted-foreground text-[11px]">
                The operator will be prompted to verify multi-factor authentication (TOTP) upon
                their first login.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Role Authorization */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Shield className="text-primary size-4" /> Platform Role & Entitlements
            </CardTitle>
            <CardDescription className="text-xs">
              Assigned operational surface privileges and administrative scope.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ControlledSelect
              name="roleId"
              label="Assigned Operational Role"
              placeholder="Select a platform role…"
              returnPrimitiveValue
              options={roleOptions}
            />

            <div className="bg-muted/20 rounded-lg border p-3.5 text-xs">
              <div className="flex items-center gap-2 font-semibold">
                <KeyRound className="text-primary size-3.5" />
                Dual-Surface Isolation Note
              </div>
              <p className="text-muted-foreground mt-1 leading-relaxed">
                Platform operators operate exclusively on internal command and compliance surfaces.
                They have zero-standing customer data access unless delegated through an audited
                support session.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button asChild variant="outline">
            <Link href="/platform/staff">Cancel</Link>
          </Button>
          <SubmitButton pending={isPending} pendingText="Provisioning Staff Member…">
            <UserPlus className="mr-2 size-4" /> Provision Staff Operator
          </SubmitButton>
        </div>
      </FormWrapper>
    </div>
  );
}
