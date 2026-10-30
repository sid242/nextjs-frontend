"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import {
  useActiveTenant,
  useDeleteTenantCustomDomain,
  useTenantUrlSettings,
  useUpdateTenantUrlSettings,
  useVerifyTenantCustomDomain,
} from "../queries";
import type { TenantUrlStyle } from "../schemas";

export function TenantUrlCard() {
  const { activeTenant } = useActiveTenant();
  const activeTenantId = activeTenant?.id ?? "";

  const { data: urlSettings, isLoading, refetch } = useTenantUrlSettings(activeTenantId);
  const updateMutation = useUpdateTenantUrlSettings(activeTenantId);
  const deleteDomainMutation = useDeleteTenantCustomDomain(activeTenantId);
  const verifyDomainMutation = useVerifyTenantCustomDomain(activeTenantId);

  const [selectedStyle, setSelectedStyle] = useState<TenantUrlStyle | null>(null);
  const [customDomainOverride, setCustomDomainOverride] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const activeStyle = selectedStyle ?? urlSettings?.urlStyle ?? "path";
  const customDomainInput = customDomainOverride ?? urlSettings?.customDomain ?? "";
  const effectiveStyle = urlSettings?.effective ?? "path";
  const allowed = urlSettings?.allowed ?? {
    path: true,
    subdomain: false,
    customDomain: false,
  };
  const urls = urlSettings?.urls;
  const canonicalBase = urlSettings?.canonicalBase ?? "";
  const status = urlSettings?.status;
  const instructions = urlSettings?.instructions;
  const reason = urlSettings?.reason;

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleSaveStyle = async () => {
    if (!activeTenantId) return;
    try {
      const payload: {
        urlStyle?: TenantUrlStyle;
        customDomain?: string | null;
      } = {
        urlStyle: activeStyle,
      };

      if (activeStyle === "customDomain" && customDomainInput.trim()) {
        payload.customDomain = customDomainInput.trim();
      }

      await updateMutation.mutateAsync(payload);
      toast.success("Workspace URL settings updated successfully!");
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update URL settings"));
    }
  };

  const handleVerifyDomain = async () => {
    if (!activeTenantId) return;
    try {
      await verifyDomainMutation.mutateAsync({ bypassVerification: false });
      toast.success("Domain verified successfully!");
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "DNS verification failed. Please check your DNS records."));
    }
  };

  const handleDeleteDomain = async () => {
    if (!activeTenantId) return;
    try {
      await deleteDomainMutation.mutateAsync();
      setCustomDomainOverride("");
      setShowDeleteConfirm(false);
      if (selectedStyle === "customDomain") {
        setSelectedStyle(allowed?.subdomain ? "subdomain" : "path");
      }
      toast.success("Custom domain removed successfully");
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove custom domain"));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Fallback Warning Banner */}
      {reason === "PLAN" && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-sm">
            <p className="font-semibold">Plan Downgrade Notice</p>
            <p className="text-muted-foreground mt-0.5 text-xs text-amber-800 dark:text-amber-300">
              Your subscription plan no longer includes custom domain or subdomain URLs. Your
              workspace is currently being served via its canonical fallback path URL:{" "}
              <span className="font-mono font-medium">{canonicalBase}</span>.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Domains & URLs</CardTitle>
              <CardDescription className="text-xs">
                Configure your workspace&apos;s canonical URL and white-label custom domain.
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              Active: {effectiveStyle}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Canonical URL Box */}
          <div className="border-border/60 bg-muted/40 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">
                Canonical Workspace URL
              </span>
              <a
                href={canonicalBase}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs"
              >
                Open <ExternalLink className="size-3" />
              </a>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <code className="text-foreground text-sm font-semibold">{canonicalBase}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(canonicalBase, "canonical")}
                className="h-8 gap-1.5 text-xs"
              >
                {copiedKey === "canonical" ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                Copy
              </Button>
            </div>
          </div>

          {/* URL Style Options */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold">Select Canonical URL Style</Label>
            <div className="grid gap-3">
              {/* Path Option */}
              <div
                onClick={() => setSelectedStyle("path")}
                className={cn(
                  "border-border/60 flex cursor-pointer items-start justify-between rounded-lg border p-4 transition-all",
                  activeStyle === "path"
                    ? "border-primary bg-primary/5 ring-primary/20 ring-1"
                    : "hover:border-border hover:bg-muted/30",
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">Path-based</span>
                    <Badge variant="secondary" className="text-[10px]">
                      Default / Fallback
                    </Badge>
                  </div>
                  <p className="text-muted-foreground font-mono text-xs">
                    {urls?.path ?? `${canonicalBase}`}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    Available on all plans. Safe downgrade fallback that never breaks bookmarks.
                  </p>
                </div>
                <div
                  className={cn(
                    "mt-0.5 size-4 rounded-full border-2 transition-all",
                    activeStyle === "path"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40",
                  )}
                />
              </div>

              {/* Subdomain Option */}
              <div
                onClick={() => {
                  if (allowed?.subdomain) {
                    setSelectedStyle("subdomain");
                  }
                }}
                className={cn(
                  "border-border/60 flex items-start justify-between rounded-lg border p-4 transition-all",
                  !allowed?.subdomain
                    ? "bg-muted/20 cursor-not-allowed opacity-60"
                    : "hover:border-border hover:bg-muted/30 cursor-pointer",
                  activeStyle === "subdomain" && allowed?.subdomain
                    ? "border-primary bg-primary/5 ring-primary/20 ring-1"
                    : "",
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">Subdomain</span>
                    {!allowed?.subdomain ? (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80 h-auto p-0 text-[11px]"
                      >
                        <Link href="/settings/billing">
                          Upgrade to Pro <ArrowUpRight className="size-3" />
                        </Link>
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Pro+
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground font-mono text-xs">
                    {urls?.subdomain ?? `https://${activeTenant?.slug ?? "slug"}.example.com`}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    Gives your organization its own dedicated branded subdomain.
                  </p>
                </div>
                <div
                  className={cn(
                    "mt-0.5 size-4 rounded-full border-2 transition-all",
                    activeStyle === "subdomain" && allowed?.subdomain
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40",
                  )}
                />
              </div>

              {/* Custom Domain Option */}
              <div
                onClick={() => {
                  if (allowed?.customDomain) {
                    setSelectedStyle("customDomain");
                  }
                }}
                className={cn(
                  "border-border/60 flex items-start justify-between rounded-lg border p-4 transition-all",
                  !allowed?.customDomain
                    ? "bg-muted/20 cursor-not-allowed opacity-60"
                    : "hover:border-border hover:bg-muted/30 cursor-pointer",
                  activeStyle === "customDomain" && allowed?.customDomain
                    ? "border-primary bg-primary/5 ring-primary/20 ring-1"
                    : "",
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">Custom Domain</span>
                    {!allowed?.customDomain ? (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80 h-auto p-0 text-[11px]"
                      >
                        <Link href="/settings/billing">
                          Upgrade to Enterprise <ArrowUpRight className="size-3" />
                        </Link>
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Enterprise
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground font-mono text-xs">
                    {urls?.customDomain ??
                      (urlSettings?.customDomain
                        ? `https://${urlSettings.customDomain}`
                        : "https://portal.yourdomain.com")}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    White-label custom domain completely branded to your company.
                  </p>
                </div>
                <div
                  className={cn(
                    "mt-0.5 size-4 rounded-full border-2 transition-all",
                    activeStyle === "customDomain" && allowed?.customDomain
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40",
                  )}
                />
              </div>
            </div>
          </div>

          {/* Custom Domain Setup Wizard (Visible if Custom Domain is allowed) */}
          {allowed?.customDomain && (
            <div className="border-border/60 bg-muted/20 space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground flex items-center gap-2 text-xs font-semibold">
                  <Globe className="text-primary size-4" /> Custom Domain Configuration
                </span>
                {status && (
                  <Badge
                    variant={
                      status === "VERIFIED" || status === "ACTIVE"
                        ? "default"
                        : status === "FAILED"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {status}
                  </Badge>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="custom-domain-input" className="text-xs">
                  Domain Hostname
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-domain-input"
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainOverride(e.target.value)}
                    placeholder="e.g. portal.acmecorp.com"
                    className="font-mono text-xs"
                  />
                  {urlSettings?.customDomain && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleVerifyDomain}
                      disabled={verifyDomainMutation.isPending}
                      className="shrink-0 gap-1.5 text-xs"
                    >
                      {verifyDomainMutation.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="size-3.5" />
                      )}
                      Verify DNS
                    </Button>
                  )}
                </div>
              </div>

              {/* DNS Challenge Instructions */}
              {(urlSettings?.customDomain || customDomainInput.trim()) && (
                <div className="border-border/50 bg-background/60 space-y-3 rounded-md border p-3 font-mono text-[11px]">
                  <p className="text-foreground font-sans font-semibold">
                    DNS Configuration Instructions
                  </p>

                  {/* CNAME Target */}
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-sans text-[10px] font-medium tracking-wider uppercase">
                      1. CNAME Record
                    </span>
                    <div className="bg-muted/60 flex items-center justify-between rounded border p-2">
                      <div>
                        <span className="text-muted-foreground">Host: </span>
                        <span>{customDomainInput.trim() || "@"}</span>
                        <span className="text-muted-foreground ml-3">Target: </span>
                        <span className="text-primary">
                          {instructions?.cnameTarget ?? "tenants.example.com"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            instructions?.cnameTarget ?? "tenants.example.com",
                            "cname",
                          )
                        }
                        className="h-6 px-2 text-[10px]"
                      >
                        {copiedKey === "cname" ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* TXT Verification */}
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-sans text-[10px] font-medium tracking-wider uppercase">
                      2. TXT Verification Record
                    </span>
                    <div className="bg-muted/60 flex items-center justify-between rounded border p-2">
                      <div>
                        <span className="text-muted-foreground">Host: </span>
                        <span>
                          _saas-verify.
                          {customDomainInput.trim() || "yourdomain.com"}
                        </span>
                        <span className="text-muted-foreground ml-3">Value: </span>
                        <span className="text-primary">
                          {instructions?.txtRecord ?? `saas-verify=${activeTenantId}`}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            instructions?.txtRecord ?? `saas-verify=${activeTenantId}`,
                            "txt",
                          )
                        }
                        className="h-6 px-2 text-[10px]"
                      >
                        {copiedKey === "txt" ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Remove Domain Action */}
              {urlSettings?.customDomain && (
                <div className="flex items-center justify-between pt-1">
                  {!showDeleteConfirm ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-destructive hover:text-destructive h-8 gap-1.5 text-xs"
                    >
                      <Trash2 className="size-3.5" /> Remove Custom Domain
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">Remove domain?</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteDomain}
                        disabled={deleteDomainMutation.isPending}
                        className="h-7 text-xs"
                      >
                        {deleteDomainMutation.isPending ? (
                          <Loader2 className="mr-1 size-3 animate-spin" />
                        ) : null}
                        Confirm Remove
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              onClick={handleSaveStyle}
              disabled={updateMutation.isPending}
              className="gap-2 text-xs"
            >
              {updateMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              Save URL Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
