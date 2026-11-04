"use client";

import * as React from "react";
import { UserCheckIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveTenant, useTenantMembers } from "@/features/tenants";

import { AccessSimulatorCard } from "./access-simulator-card";
import { EffectiveAccessView } from "./effective-access-view";

interface TenantMemberItem {
  id: string;
  userId: string;
  name?: string | null;
  email?: string | null;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export function AccessSimulatorContainer() {
  const { activeTenant } = useActiveTenant();
  const { data: rawMembers = [], isLoading: isMembersLoading } = useTenantMembers(activeTenant?.id);

  const formattedMembers = React.useMemo(() => {
    return (rawMembers as TenantMemberItem[]).map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user?.name ?? m.name ?? null,
      email: m.user?.email ?? m.email ?? "",
    }));
  }, [rawMembers]);

  const [customSelectedUserId, setCustomSelectedUserId] = React.useState<string>("");

  const selectedUserId = customSelectedUserId || formattedMembers[0]?.userId || "";

  if (!activeTenant?.id) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
        Select a workspace to inspect effective access and run simulations.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Target Member Selector Card */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheckIcon className="text-primary h-4 w-4" />
            Inspect Workspace Member Access
          </CardTitle>
          <CardDescription>
            Choose a member to inspect their resolved permissions matrix, direct roles, group
            memberships, and test hypothetical authorization scenarios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md space-y-1.5">
            <Label htmlFor="inspectUserSelect" className="text-xs">
              Select Member
            </Label>
            <Select
              value={selectedUserId}
              onValueChange={setCustomSelectedUserId}
              disabled={isMembersLoading || formattedMembers.length === 0}
            >
              <SelectTrigger id="inspectUserSelect">
                <SelectValue placeholder="Select a workspace member..." />
              </SelectTrigger>
              <SelectContent>
                {formattedMembers.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.name ? `${m.name} (${m.email})` : m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Simulator Form */}
      <AccessSimulatorCard
        tenantId={activeTenant.id}
        defaultUserId={selectedUserId}
        members={formattedMembers}
      />

      {/* Effective Access Matrix */}
      {selectedUserId ? (
        <EffectiveAccessView tenantId={activeTenant.id} userId={selectedUserId} />
      ) : (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          Select a member above to inspect their permissions provenance.
        </div>
      )}
    </div>
  );
}
