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

export function TenantSettingsCard() {
  const { activeTenant, activeTenantId } = useActiveTenant();
  const updateTenantMutation = useUpdateTenant(activeTenantId ?? "");
  const { data: modules = [], isLoading: modulesLoading } = useTenantModules(activeTenantId);
  const toggleModuleMutation = useToggleTenantModule(activeTenantId ?? "");

  const [orgName, setOrgName] = useState(activeTenant?.name ?? "");
  const [selectedPlan, setSelectedPlan] = useState<TenantPlan>(activeTenant?.plan ?? "PRO");

  const handleUpdate = async () => {
    if (!orgName.trim() || !activeTenantId) return;
    try {
      await updateTenantMutation.mutateAsync({
        name: orgName.trim(),
        plan: selectedPlan,
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
      <Card className="border-border/60 shadow-xs">
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
            <Label htmlFor="org-name-input">Organization Name</Label>
            <Input
              id="org-name-input"
              value={orgName}
              onChange={(e) => setOrgName(e?.target?.value ?? "")}
              placeholder="e.g. Acme Corporation"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="plan-select">Subscription Plan</Label>
            <Select
              value={selectedPlan}
              onValueChange={(val) => setSelectedPlan(val as TenantPlan)}
            >
              <SelectTrigger id="plan-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">Free Tier (Community)</SelectItem>
                <SelectItem value="PRO">Pro Tier (Growth & Collaboration)</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise (Dedicated Resources)</SelectItem>
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
              disabled={updateTenantMutation.isPending || !orgName.trim()}
              className="gap-2 shadow-xs"
            >
              <SparklesIcon className="size-3.5" />
              {updateTenantMutation.isPending ? "Updating…" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-xs">
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
