import { Check, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { Plan } from "../schemas";

interface PlanCardProps {
  plan: Plan;
  isCurrent?: boolean;
  actionSlot?: React.ReactNode;
}

export function PlanCard({ plan, isCurrent, actionSlot }: PlanCardProps) {
  const isEnterprise = plan?.key === "ENTERPRISE";
  const formattedPrice =
    plan?.priceCents === 0
      ? "$0"
      : `$${(plan?.priceCents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

  return (
    <Card
      className={`relative flex flex-col justify-between transition-all ${
        isCurrent
          ? "border-primary/80 bg-primary/5 shadow-primary/10 ring-primary/40 shadow-md ring-1"
          : isEnterprise
            ? "bg-card/60 border-amber-500/40 shadow-lg"
            : "border-border/80 bg-card/40 hover:border-border"
      }`}
    >
      {isCurrent ? (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-primary text-primary-foreground font-mono text-[10px] tracking-wide uppercase">
            Current Active Plan
          </Badge>
        </div>
      ) : null}

      <div>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="font-mono text-[11px] font-semibold uppercase">
              {plan?.key}
            </Badge>
            {isEnterprise ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                <Sparkles className="h-3 w-3" />
                Popular
              </span>
            ) : null}
          </div>
          <CardTitle className="pt-2 text-xl font-bold tracking-tight">{plan?.name}</CardTitle>
          <CardDescription className="line-clamp-2 text-xs">
            {plan?.description ?? "Scalable access tier for collaborative teams."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-3xl font-extrabold tracking-tight">
              {formattedPrice}
            </span>
            <span className="text-muted-foreground text-xs">
              {plan?.billingInterval === "MONTHLY"
                ? "/ month"
                : plan?.billingInterval === "ANNUAL"
                  ? "/ year"
                  : ""}
            </span>
          </div>

          <div className="border-border/60 space-y-2.5 border-t pt-3 text-xs">
            <div className="flex items-center gap-2">
              <Check className="text-primary h-3.5 w-3.5 shrink-0" />
              <span>
                Up to{" "}
                <strong className="font-semibold">
                  {plan?.entitlements?.maxMembers ?? 5} team seats
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="text-primary h-3.5 w-3.5 shrink-0" />
              <span>
                <strong className="font-semibold">
                  {plan?.entitlements?.maxProjects ?? 10} active projects
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="text-primary h-3.5 w-3.5 shrink-0" />
              <span>
                <strong className="font-semibold">
                  {((plan?.entitlements?.maxStorageMb ?? 1024) / 1024).toFixed(0)} GB
                </strong>{" "}
                secure cloud storage
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="text-primary h-3.5 w-3.5 shrink-0" />
              <span>
                {plan?.entitlements?.hasCustomRoles
                  ? "Custom dynamic RBAC roles"
                  : "Standard workspace roles"}
              </span>
            </div>
            {plan?.entitlements?.hasAdvancedAnalytics ? (
              <div className="flex items-center gap-2">
                <Check className="text-primary h-3.5 w-3.5 shrink-0" />
                <span>Executive analytics & digests</span>
              </div>
            ) : null}
            {plan?.entitlements?.hasPrioritySupport ? (
              <div className="flex items-center gap-2">
                <Check className="text-primary h-3.5 w-3.5 shrink-0" />
                <span>24/7 Priority delegated support</span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </div>

      {actionSlot ? <CardFooter className="pt-2">{actionSlot}</CardFooter> : null}
    </Card>
  );
}
