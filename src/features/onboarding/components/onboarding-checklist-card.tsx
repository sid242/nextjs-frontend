"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  PartyPopper,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveTenant } from "@/features/tenants";
import { useTenantHref } from "@/lib/tenancy/use-tenant-href";

import { useOnboardingOverview, useSkipStep, useUpdateStepProgress } from "../queries";

export function OnboardingChecklistCard() {
  const { activeTenantId } = useActiveTenant();
  const tenantHref = useTenantHref();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: overview, isLoading, error } = useOnboardingOverview(activeTenantId);
  const skipMutation = useSkipStep(activeTenantId);
  const updateMutation = useUpdateStepProgress(activeTenantId);

  if (isLoading) {
    return <Skeleton className="h-44 w-full rounded-xl" />;
  }

  if (error || !overview) {
    return null;
  }

  // If complete and user dismissed, keep hidden
  if (overview.isComplete && overview.isDismissed && isCollapsed) {
    return null;
  }

  const { steps, progressPercent, completedCount, totalCount, isComplete } = overview;

  return (
    <Card className="border-primary/20 from-primary/5 via-background to-background overflow-hidden bg-gradient-to-br shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
              {isComplete ? <PartyPopper className="size-4" /> : <Sparkles className="size-4" />}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                {isComplete ? "Workspace Setup Complete!" : "Getting Started Checklist"}
                <Badge
                  variant={isComplete ? "default" : "secondary"}
                  className="font-mono text-[10px]"
                >
                  {completedCount} / {totalCount} Done
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                {isComplete
                  ? "Congratulations! Your organization foundation is fully activated and configured."
                  : "Complete these key configuration steps to unlock the full power of your workspace."}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary text-xs font-semibold">{progressPercent}%</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="size-7"
            >
              {isCollapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </Button>
          </div>
        </div>
        <Progress value={progressPercent} className="mt-2 h-1.5" />
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-1">
          <div className="grid gap-2 sm:grid-cols-2">
            {steps.map((step) => {
              const isDone = step.status === "COMPLETED";
              const isSkipped = step.status === "SKIPPED";

              return (
                <div
                  key={step.key}
                  className={`flex items-start justify-between gap-2 rounded-lg border p-2.5 transition-all ${
                    isDone
                      ? "bg-muted/30 border-border/40 opacity-70"
                      : isSkipped
                        ? "bg-muted/20 border-border/50 border-dashed opacity-60"
                        : "bg-background border-border hover:border-primary/40 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {isDone ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    ) : isSkipped ? (
                      <Ban className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    ) : (
                      <Circle className="text-primary/60 mt-0.5 size-4 shrink-0" />
                    )}
                    <div className="space-y-0.5">
                      <div className="text-foreground flex items-center gap-1.5 text-xs font-medium">
                        <span className={isDone ? "text-muted-foreground line-through" : ""}>
                          {step.title}
                        </span>
                        {step.autoDetected && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            (Auto)
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground line-clamp-1 text-[11px]">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {!isDone && !isSkipped && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={skipMutation.isPending}
                          onClick={() => skipMutation.mutate(step.key)}
                          className="text-muted-foreground hover:text-foreground h-6 px-1.5 text-[10px]"
                        >
                          Skip
                        </Button>
                        <Button
                          asChild
                          variant="secondary"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                        >
                          <Link href={tenantHref(step.href)}>
                            Set up <ArrowRight className="ml-1 size-2.5" />
                          </Link>
                        </Button>
                      </>
                    )}
                    {isSkipped && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={updateMutation.isPending}
                        onClick={() =>
                          updateMutation.mutate({
                            stepKey: step.key,
                            input: { status: "COMPLETED" },
                          })
                        }
                        className="h-6 px-1.5 text-[10px]"
                      >
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
