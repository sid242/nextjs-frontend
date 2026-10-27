"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, HelpCircle, Shield, Sparkles, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicPlans } from "@/features/plans";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const { data: plans = [], isLoading } = usePublicPlans();

  const filteredPlans = plans?.filter((p) => p?.isPublic !== false) ?? [];

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero Header */}
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <Badge variant="outline" className="border-primary/30 text-primary px-3 py-1 text-xs">
          Predictable Pricing
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
          Simple, transparent pricing for modern engineering teams
        </h1>
        <p className="text-muted-foreground text-base text-pretty">
          Choose the tier that matches your team capacity. Scale seamlessly with full role-based
          access control, dedicated quotas, and isolated environments.
        </p>

        {/* Monthly / Annual Toggle */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <span
            className={`cursor-pointer text-xs font-semibold ${
              !isAnnual ? "text-foreground" : "text-muted-foreground"
            }`}
            onClick={() => setIsAnnual(false)}
          >
            Monthly Billing
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isAnnual}
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isAnnual ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`bg-background pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out ${
                isAnnual ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`flex cursor-pointer items-center gap-1.5 text-xs font-semibold ${
              isAnnual ? "text-foreground" : "text-muted-foreground"
            }`}
            onClick={() => setIsAnnual(true)}
          >
            Annual Billing
            <Badge variant="default" className="bg-emerald-600 px-1.5 py-0 text-[10px]">
              Save 20%
            </Badge>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="flex flex-col justify-between space-y-4 p-6">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-36" />
              <div className="space-y-2 py-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
              <Skeleton className="h-10 w-full rounded-md" />
            </Card>
          ))
        ) : filteredPlans.length === 0 ? (
          <div className="text-muted-foreground col-span-full py-12 text-center text-sm">
            No public plans currently available. Please contact sales.
          </div>
        ) : (
          filteredPlans.map((plan) => {
            const isEnterprise = plan?.key === "ENTERPRISE";
            const basePrice = plan?.priceCents / 100;
            const effectivePrice = isAnnual ? Math.round(basePrice * 0.8) : basePrice;

            return (
              <Card
                key={plan?.id}
                className={`relative flex flex-col justify-between transition-all duration-200 ${
                  isEnterprise
                    ? "border-primary/60 ring-primary/20 bg-card shadow-lg ring-1"
                    : "border-border hover:border-border/80 bg-card/60"
                }`}
              >
                {isEnterprise ? (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold uppercase">
                      <Sparkles className="mr-1 inline h-3 w-3" /> Most Popular
                    </Badge>
                  </div>
                ) : null}

                <div>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-[11px] uppercase">
                        {plan?.key}
                      </Badge>
                    </div>
                    <CardTitle className="pt-2 text-xl font-bold">{plan?.name}</CardTitle>
                    <CardDescription className="min-h-8 text-xs">
                      {plan?.description ??
                        "Scalable foundation for expanding teams and organizations."}
                    </CardDescription>

                    <div className="flex items-baseline gap-1 pt-4">
                      <span className="text-3xl font-extrabold tracking-tight">
                        {effectivePrice === 0 ? "$0" : `$${effectivePrice}`}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {effectivePrice === 0
                          ? "forever"
                          : isAnnual
                            ? "/user/mo (billed annually)"
                            : "/user/month"}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-2">
                    <div className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      Included Capabilities:
                    </div>
                    <ul className="space-y-2 text-xs">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>
                          <strong>{plan?.entitlements?.maxMembers ?? 5}</strong> Team Members
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>
                          <strong>
                            {((plan?.entitlements?.maxStorageMb ?? 1024) / 1024).toFixed(0)} GB
                          </strong>{" "}
                          Storage Quota
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>
                          {plan?.entitlements?.hasCustomRoles
                            ? "Custom RBAC Roles & Permissions"
                            : "Standard Team Roles"}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>
                          {plan?.entitlements?.hasAdvancedAnalytics
                            ? "Advanced Telemetry & Analytics"
                            : "Basic Usage Reporting"}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>
                          {plan?.entitlements?.hasPrioritySupport
                            ? "24/7 Priority Support & SLAs"
                            : "Standard Email Support"}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>
                          <strong>{plan?.entitlements?.hasAuditRetentionDays ?? 30} Days</strong>{" "}
                          Audit Log Retention
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </div>

                <CardFooter className="border-border/50 border-t pt-4">
                  <Button
                    asChild
                    className="w-full text-xs font-medium"
                    variant={isEnterprise ? "default" : "outline"}
                  >
                    <Link href="/register">
                      {effectivePrice === 0 ? "Start for Free" : "Get Started"}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* Feature Comparison Matrix */}
      <div className="mt-20">
        <div className="mb-8 space-y-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Compare Plan Features</h2>
          <p className="text-muted-foreground text-xs">
            Detailed breakdown of quotas, permissions, and security standards.
          </p>
        </div>

        <div className="border-border bg-card/40 overflow-hidden rounded-xl border">
          <div className="border-border bg-muted/30 grid grid-cols-4 border-b p-4 text-xs font-semibold">
            <div>Feature</div>
            <div className="text-center">Free</div>
            <div className="text-center">Pro</div>
            <div className="text-center">Enterprise</div>
          </div>
          <div className="divide-border divide-y text-xs">
            <div className="grid grid-cols-4 items-center p-4">
              <span className="text-foreground font-medium">Team Members</span>
              <span className="text-muted-foreground text-center">Up to 3</span>
              <span className="text-muted-foreground text-center">Up to 15</span>
              <span className="text-primary text-center font-semibold">Unlimited</span>
            </div>
            <div className="grid grid-cols-4 items-center p-4">
              <span className="text-foreground font-medium">Storage Allocation</span>
              <span className="text-muted-foreground text-center">1 GB</span>
              <span className="text-muted-foreground text-center">10 GB</span>
              <span className="text-primary text-center font-semibold">100 GB</span>
            </div>
            <div className="grid grid-cols-4 items-center p-4">
              <span className="text-foreground font-medium">Custom Roles & RBAC Matrix</span>
              <span className="text-muted-foreground text-center">—</span>
              <span className="text-muted-foreground text-center">Included</span>
              <span className="text-primary text-center font-semibold">Included</span>
            </div>
            <div className="grid grid-cols-4 items-center p-4">
              <span className="text-foreground font-medium">Audit Log Retention</span>
              <span className="text-muted-foreground text-center">7 days</span>
              <span className="text-muted-foreground text-center">90 days</span>
              <span className="text-primary text-center font-semibold">365 days</span>
            </div>
            <div className="grid grid-cols-4 items-center p-4">
              <span className="text-foreground font-medium">Custom Domain & White-labeling</span>
              <span className="text-muted-foreground text-center">—</span>
              <span className="text-muted-foreground text-center">—</span>
              <span className="text-primary text-center font-semibold">Full Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="border-border mt-20 border-t pt-12">
        <div className="mb-10 space-y-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-xs">
            Everything you need to know about plans and billing.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 text-xs md:grid-cols-2">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <HelpCircle className="text-primary h-4 w-4" />
                Can I switch plans or upgrade later?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Yes, you can upgrade, downgrade, or switch between billing intervals at any time
              directly from your Workspace Settings. Upgrades take effect immediately.
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Shield className="text-primary h-4 w-4" />
                What happens when our workspace reaches member seat limits?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Invitations will be safely paused to prevent accidental overage charges until a
              workspace administrator upgrades to a higher plan tier with more seats.
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Zap className="text-primary h-4 w-4" />
                Are invoices itemized with tax numbers?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Yes, every invoice statement generated in your Workspace Settings includes an itemized
              breakdown of subscription fees, line items, and applicable taxes.
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <HelpCircle className="text-primary h-4 w-4" />
                What payment methods are supported?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              We support all major credit cards (Visa, Mastercard, American Express), bank transfers
              for annual contracts, and localized payment rails.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
