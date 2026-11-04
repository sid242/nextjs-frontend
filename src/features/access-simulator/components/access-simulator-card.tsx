"use client";

import * as React from "react";
import {
  PlayIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TerminalIcon,
} from "lucide-react";
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

import { useSimulateAccess } from "../queries";
import type { SimulationResult } from "../types";

interface AccessSimulatorCardProps {
  tenantId: string;
  defaultUserId?: string;
  members?: Array<{ id: string; userId: string; name: string | null; email: string }>;
}

const COMMON_PERMISSIONS = [
  { key: "files:read", label: "View Workspace Files (files:read)" },
  { key: "files:write", label: "Upload & Edit Files (files:write)" },
  { key: "members:invite", label: "Invite Members (members:invite)" },
  { key: "roles:assign", label: "Assign Member Roles (roles:assign)" },
  { key: "audit:read", label: "View Audit Logs (audit:read)" },
  { key: "audit:export", label: "Export Audit Logs (audit:export)" },
  { key: "tenants:update", label: "Update Workspace Settings (tenants:update)" },
  { key: "tenants:delete", label: "Delete Workspace (tenants:delete)" },
];

export function AccessSimulatorCard({
  tenantId,
  defaultUserId = "",
  members = [],
}: AccessSimulatorCardProps) {
  const [userId, setUserId] = React.useState(defaultUserId);
  const [permission, setPermission] = React.useState("files:read");
  const [customPermission, setCustomPermission] = React.useState("");
  const [useCustomPerm, setUseCustomPerm] = React.useState(false);
  const [result, setResult] = React.useState<SimulationResult | null>(null);

  const simulateMutation = useSimulateAccess(tenantId);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveTargetUserId = userId.trim();
    const effectivePerm = useCustomPerm ? customPermission.trim() : permission;

    if (!effectiveTargetUserId) {
      toast.error("Please select or enter a target user ID");
      return;
    }

    if (!effectivePerm) {
      toast.error("Please select or specify a permission to test");
      return;
    }

    try {
      const res = await simulateMutation.mutateAsync({
        userId: effectiveTargetUserId,
        permission: effectivePerm,
      });
      setResult(res);
      toast.success("Access simulation completed with 0 database mutations");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to execute simulation";
      toast.error(message);
    }
  };

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <SparklesIcon className="text-primary h-5 w-5" />
          <CardTitle className="text-lg">Zero-Mutation Access Simulator</CardTitle>
        </div>
        <CardDescription>
          Simulate authorization checks for any member and permission without altering database
          state or triggering side effects.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSimulate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Target Member Selector */}
            <div className="space-y-2">
              <Label htmlFor="simUser">Target Member</Label>
              {members.length > 0 ? (
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger id="simUser">
                    <SelectValue placeholder="Select workspace member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.name ? `${m.name} (${m.email})` : m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="simUser"
                  placeholder="Enter User UUID..."
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              )}
            </div>

            {/* Permission Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="simPerm">Target Permission</Label>
                <button
                  type="button"
                  onClick={() => setUseCustomPerm(!useCustomPerm)}
                  className="text-primary text-xs underline hover:opacity-80"
                >
                  {useCustomPerm ? "Select from list" : "Enter custom key"}
                </button>
              </div>

              {useCustomPerm ? (
                <Input
                  id="simPerm"
                  placeholder="e.g. files:export or billing:manage"
                  value={customPermission}
                  onChange={(e) => setCustomPermission(e.target.value)}
                />
              ) : (
                <Select value={permission} onValueChange={setPermission}>
                  <SelectTrigger id="simPerm">
                    <SelectValue placeholder="Select permission" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_PERMISSIONS.map((p) => (
                      <SelectItem key={p.key} value={p.key}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={simulateMutation.isPending}>
              <PlayIcon className="mr-2 h-4 w-4" />
              {simulateMutation.isPending ? "Evaluating Trace..." : "Simulate Access Rule"}
            </Button>
          </div>
        </form>

        {/* Simulation Output */}
        {result && (
          <div className="bg-muted/20 space-y-4 rounded-lg border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {result.allowed ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 bg-emerald-50 px-3 py-1 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    <ShieldCheckIcon className="mr-1.5 h-4 w-4 text-emerald-600" />
                    DECISION: ALLOWED
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-rose-500/40 bg-rose-50 px-3 py-1 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                  >
                    <ShieldAlertIcon className="mr-1.5 h-4 w-4 text-rose-600" />
                    DECISION: DENIED
                  </Badge>
                )}
                <span className="text-muted-foreground font-mono text-xs">
                  Read-only simulation
                </span>
              </div>

              {(result.matchedRoles?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1">
                  {result.matchedRoles.map((r) => (
                    <Badge key={r} variant="secondary" className="text-xs">
                      Role: {r}
                    </Badge>
                  ))}
                  {result.matchedGroups.map((g) => (
                    <Badge
                      key={g}
                      variant="outline"
                      className="border-sky-500/40 text-xs text-sky-700 dark:text-sky-300"
                    >
                      Group: {g}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-background rounded-md border p-3 text-xs">
              <span className="text-muted-foreground font-semibold">Explanation: </span>
              <span
                className={
                  result.allowed
                    ? "font-medium text-emerald-600 dark:text-emerald-400"
                    : "font-medium text-rose-600 dark:text-rose-400"
                }
              >
                {result.reason}
              </span>
            </div>

            {/* Step-by-Step Evaluation Trace */}
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
                <TerminalIcon className="h-4 w-4" />
                Step-by-Step Evaluation Trace ({result.evaluationTrace?.length ?? 0} steps)
              </div>
              <div className="max-h-56 overflow-x-auto rounded-md bg-zinc-950 p-3 font-mono text-xs text-zinc-100">
                {result.evaluationTrace?.map((step, idx) => (
                  <div
                    key={idx}
                    className={`py-0.5 ${
                      step.includes("[DECISION: ALLOW]") ||
                      step.includes("[PASS]") ||
                      step.includes("[MATCH]")
                        ? "text-emerald-400"
                        : step.includes("[DENY]") || step.includes("[FAIL]")
                          ? "font-semibold text-rose-400"
                          : "text-zinc-400"
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
