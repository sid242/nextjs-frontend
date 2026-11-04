"use client";

import * as React from "react";
import { CheckCircle2Icon, ClockIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useTenantAuditPolicy, useUpdateTenantAuditPolicy } from "../queries";
import type { TenantAuditPolicy } from "../types";

interface AuditRetentionCardProps {
  tenantId: string;
  isPolicyManageAllowed?: boolean;
}

export function AuditRetentionCard({
  tenantId,
  isPolicyManageAllowed = true,
}: AuditRetentionCardProps) {
  const { data: policy, isLoading } = useTenantAuditPolicy(tenantId);

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockIcon className="text-primary h-5 w-5" />
            <CardTitle className="text-lg">Audit Log Retention & Compliance</CardTitle>
          </div>
          <Badge variant="outline" className="border-primary/40 text-primary">
            <ShieldCheckIcon className="mr-1 h-3.5 w-3.5" />
            {policy?.complianceFramework || "SOC2"}
          </Badge>
        </div>
        <CardDescription>
          Configure how long security audit events are retained and queryable before automatic
          archival.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <AuditRetentionFormInner
          key={policy?.id ?? "default"}
          tenantId={tenantId}
          policy={policy}
          isLoading={isLoading}
          isPolicyManageAllowed={isPolicyManageAllowed}
        />
      </CardContent>
    </Card>
  );
}

interface AuditRetentionFormInnerProps {
  tenantId: string;
  policy?: TenantAuditPolicy;
  isLoading: boolean;
  isPolicyManageAllowed: boolean;
}

function AuditRetentionFormInner({
  tenantId,
  policy,
  isLoading,
  isPolicyManageAllowed,
}: AuditRetentionFormInnerProps) {
  const updatePolicyMutation = useUpdateTenantAuditPolicy(tenantId);

  const [formData, setFormData] = React.useState({
    retentionDays: policy?.retentionDays ?? 90,
    complianceFramework: policy?.complianceFramework ?? "SOC2",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPolicyManageAllowed) {
      toast.error("You lack permission to update audit retention policies.");
      return;
    }

    try {
      await updatePolicyMutation.mutateAsync({
        retentionDays: Number(formData.retentionDays),
        complianceFramework: formData.complianceFramework,
      });
      toast.success("Retention policy updated successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update retention policy";
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="retentionDays">Retention Window (Days)</Label>
          <Input
            id="retentionDays"
            type="number"
            min={7}
            max={3650}
            value={formData.retentionDays}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                retentionDays: Number(e.target.value),
              }))
            }
            disabled={isLoading || !isPolicyManageAllowed}
          />
          <span className="text-muted-foreground text-xs">
            Standard plans allow up to 90 days. Enterprise plans allow up to 3650 days (10 years).
          </span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="complianceFramework">Compliance Standard</Label>
          <Select
            value={formData.complianceFramework}
            onValueChange={(val) => setFormData((prev) => ({ ...prev, complianceFramework: val }))}
            disabled={isLoading || !isPolicyManageAllowed}
          >
            <SelectTrigger id="complianceFramework">
              <SelectValue placeholder="Select standard" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SOC2">SOC2 Type II</SelectItem>
              <SelectItem value="HIPAA">HIPAA (Healthcare)</SelectItem>
              <SelectItem value="GDPR">GDPR (EU Privacy)</SelectItem>
              <SelectItem value="ISO27001">ISO 27001</SelectItem>
              <SelectItem value="CUSTOM">Custom Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-xs">
            Framework used to format metadata hashes in automated compliance exports.
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-muted-foreground text-xs">
          {policy?.lastArchivedAt ? (
            <>Last automatic archival run: {new Date(policy.lastArchivedAt).toLocaleString()}</>
          ) : (
            <>Logs are actively maintained according to policy schedule.</>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading || updatePolicyMutation.isPending || !isPolicyManageAllowed}
        >
          <CheckCircle2Icon className="mr-2 h-4 w-4" />
          {updatePolicyMutation.isPending ? "Saving..." : "Save Policy"}
        </Button>
      </div>
    </form>
  );
}
