"use client";

import { useState } from "react";
import { Building2Icon, LayersIcon, SparklesIcon } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  useActiveTenant,
  useTenantModules,
  useToggleTenantModule,
  useUpdateTenant,
  type TenantModule,
  type TenantPlan,
} from "@/features/tenants";

interface TenantSettingsFormState {
  orgName: string;
  selectedPlan: TenantPlan;
}

const TENANT_PLAN_SELECT_OPTIONS: Array<{ value: TenantPlan; label: string }> = [
  { value: "FREE", label: "Free Tier (Community)" },
  { value: "PRO", label: "Pro Tier (Growth & Collaboration)" },
  { value: "ENTERPRISE", label: "Enterprise (Dedicated Resources)" },
];

export function TenantSettingsCard() {
  const { activeTenant, activeTenantId } = useActiveTenant();
  const updateTenantMutation = useUpdateTenant(activeTenantId ?? "");
  const { data: modules = [], isLoading: modulesLoading } = useTenantModules(activeTenantId);
  const toggleModuleMutation = useToggleTenantModule(activeTenantId ?? "");

  const [formState, setFormState] = useState<TenantSettingsFormState>({
    orgName: activeTenant?.name ?? "",
    selectedPlan: (activeTenant?.plan ?? "PRO") as TenantPlan,
  });

  const handleUpdate = async () => {
    if (!formState.orgName.trim() || !activeTenantId) return;
    try {
      await updateTenantMutation.mutateAsync({
        name: formState.orgName.trim(),
        plan: formState.selectedPlan,
      });
      toast.success("Workspace profile updated successfully!");
    } catch {
      toast.error("Failed to update workspace details.");
    }
  };

  const handleToggleModule = async (moduleId: string, current: boolean) => {
    if (!activeTenantId) return;
    try {
      await toggleModuleMutation.mutateAsync({ moduleId, isEnabled: !current });
      toast.success("Feature module status updated.");
    } catch {
      toast.error("Failed to update feature module.");
    }
  };

  return (
    <div className="grid gap-6">
      <Card className="border-border/80 rounded-2xl shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Building2Icon className="text-primary size-4" /> Organization Workspace Details
          </CardTitle>
          <CardDescription className="text-xs">
            Manage your organization name, slug, and subscription plan tier.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="org-name-input" className="text-muted-foreground text-xs font-medium">
              Organization Name
            </Label>
            <Input
              id="org-name-input"
              value={formState.orgName}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, orgName: e?.target?.value ?? "" }))
              }
              placeholder="e.g. Acme Corporation"
              className="border-border/80 h-10 rounded-xl text-xs"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="plan-select" className="text-muted-foreground text-xs font-medium">
              Subscription Plan
            </Label>
            <Select
              value={formState.selectedPlan}
              onValueChange={(val) =>
                setFormState((prev) => ({ ...prev, selectedPlan: val as TenantPlan }))
              }
            >
              <SelectTrigger id="plan-select" className="border-border/80 h-10 rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border/80 rounded-xl shadow-md">
                {TENANT_PLAN_SELECT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-2 sm:col-span-2">
            <div className="text-muted-foreground text-xs">
              Workspace identifier:{" "}
              <span className="text-foreground font-mono font-semibold">{activeTenant?.slug}</span>
            </div>
            <Button
              onClick={handleUpdate}
              disabled={updateTenantMutation.isPending || !formState.orgName.trim()}
              className="h-10 gap-2 rounded-xl text-xs shadow-xs"
            >
              <SparklesIcon className="size-3.5" />
              {updateTenantMutation.isPending ? "Updating…" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 rounded-2xl shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <LayersIcon className="size-4 text-blue-500" /> Feature Entitlements & Modules
          </CardTitle>
          <CardDescription className="text-xs">
            Enable or disable workspace features and modules for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {modulesLoading ? (
            <div className="text-muted-foreground animate-pulse p-6 text-center text-xs">
              Loading workspace feature entitlements…
            </div>
          ) : (
            <div className="divide-border/50 divide-y">
              {modules.map((mod: TenantModule) => (
                <div
                  key={mod.id}
                  className="hover:bg-accent/30 flex items-center justify-between px-4 py-3 transition-colors sm:px-6"
                >
                  <div className="grid gap-0.5 leading-tight">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground text-xs font-semibold">{mod.name}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {mod.key}
                      </Badge>
                    </div>
                    {mod.description && (
                      <span className="text-muted-foreground text-[11px]">{mod.description}</span>
                    )}
                  </div>

                  <Switch
                    checked={mod.isEnabled}
                    onCheckedChange={() => handleToggleModule(mod.id, mod.isEnabled)}
                    disabled={toggleModuleMutation.isPending}
                    aria-label={`Toggle ${mod.name}`}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
