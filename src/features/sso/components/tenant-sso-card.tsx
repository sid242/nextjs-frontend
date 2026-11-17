"use client";

import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTenantSubscription, type TenantSubscription } from "@/features/plans";
import { useActiveTenant } from "@/features/tenants";
import { useTenantHref } from "@/lib/tenancy";

import {
  useCreateScimToken,
  useRevokeScimToken,
  useRotateScimToken,
  useScimTokens,
  useTenantSsoConfig,
  useTestSsoConnection,
  useUpdateTenantSsoConfig,
} from "../queries";
import type { SsoProviderType, SsoStatus, TenantSsoConfig } from "../types";

interface SsoFormData {
  providerType: SsoProviderType;
  status: SsoStatus;
  idpEntityId: string;
  idpSsoUrl: string;
  idpCertificate: string;
  oidcClientId: string;
  oidcClientSecret: string;
  oidcDiscoveryUrl: string;
  enforceSso: boolean;
  allowedDomains: string[];
  jitProvisioning: boolean;
}

export function TenantSsoCard() {
  const tenantHref = useTenantHref();
  const { activeTenant } = useActiveTenant();
  const tenantId = activeTenant?.id;
  const { data: ssoConfig, isLoading: isLoadingConfig } = useTenantSsoConfig(tenantId);
  const { data: subscription } = useTenantSubscription();

  if (isLoadingConfig) {
    return (
      <div className="border-border/40 bg-card text-muted-foreground rounded-lg border p-8 text-center text-xs">
        Loading SSO and SCIM settings...
      </div>
    );
  }

  return (
    <TenantSsoCardInner
      key={ssoConfig?.updatedAt || tenantId || "sso-form"}
      tenantId={tenantId}
      ssoConfig={ssoConfig}
      subscription={subscription}
    />
  );
}

interface TenantSsoCardInnerProps {
  tenantId?: string;
  ssoConfig?: TenantSsoConfig;
  subscription?: TenantSubscription;
}

function TenantSsoCardInner({ tenantId, ssoConfig, subscription }: TenantSsoCardInnerProps) {
  const tenantHref = useTenantHref();
  const { data: scimTokens, isLoading: isLoadingTokens } = useScimTokens(tenantId);

  const updateConfig = useUpdateTenantSsoConfig(tenantId);
  const testConnection = useTestSsoConnection(tenantId);
  const createScimToken = useCreateScimToken(tenantId);
  const rotateScimToken = useRotateScimToken(tenantId);
  const revokeScimToken = useRevokeScimToken(tenantId);

  // Grouped form state container initialized from server data
  const [formData, setFormData] = useState<SsoFormData>(() => ({
    providerType: ssoConfig?.providerType ?? "SAML",
    status: ssoConfig?.status ?? "DISABLED",
    idpEntityId: ssoConfig?.idpEntityId ?? "",
    idpSsoUrl: ssoConfig?.idpSsoUrl ?? "",
    idpCertificate: ssoConfig?.idpCertificate ?? "",
    oidcClientId: ssoConfig?.oidcClientId ?? "",
    oidcClientSecret: ssoConfig?.oidcClientSecret ?? "",
    oidcDiscoveryUrl: ssoConfig?.oidcDiscoveryUrl ?? "",
    enforceSso: Boolean(ssoConfig?.enforceSso),
    allowedDomains: ssoConfig?.allowedDomains ?? [],
    jitProvisioning: Boolean(ssoConfig?.jitProvisioning ?? true),
  }));

  const [newDomainInput, setNewDomainInput] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // SCIM token dialog state
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenExpiryDays, setNewTokenExpiryDays] = useState(365);
  const [newTokenAllowedIps, setNewTokenAllowedIps] = useState("");
  const [generatedRawToken, setGeneratedRawToken] = useState<string | null>(null);

  // SCIM token rotation state
  const [isRotateDialogOpen, setIsRotateDialogOpen] = useState(false);
  const [selectedTokenForRotate, setSelectedTokenForRotate] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [rotateExpiryDays, setRotateExpiryDays] = useState(365);
  const [rotatedRawToken, setRotatedRawToken] = useState<string | null>(null);

  const isEnterprise =
    subscription?.plan?.key === "ENTERPRISE" ||
    subscription?.plan?.key?.toLowerCase() === "enterprise";

  const updateField = <K extends keyof SsoFormData>(field: K, value: SsoFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddDomain = () => {
    const trimmed = newDomainInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!trimmed.includes(".") || trimmed.includes("@")) {
      toast.error("Please enter a valid domain (e.g. acme.com)");
      return;
    }
    if (formData.allowedDomains.includes(trimmed)) {
      toast.error("Domain already added");
      return;
    }
    updateField("allowedDomains", [...formData.allowedDomains, trimmed]);
    setNewDomainInput("");
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    updateField(
      "allowedDomains",
      formData.allowedDomains.filter((d) => d !== domainToRemove),
    );
  };

  const handleTestConnection = async () => {
    setTestResult(null);
    try {
      const res = await testConnection.mutateAsync({
        providerType: formData.providerType,
        idpEntityId: formData.idpEntityId || undefined,
        idpSsoUrl: formData.idpSsoUrl || undefined,
        idpCertificate: formData.idpCertificate || undefined,
        oidcDiscoveryUrl: formData.oidcDiscoveryUrl || undefined,
      });
      setTestResult({ success: true, message: res.message });
      toast.success(res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection test failed";
      setTestResult({ success: false, message: msg });
      toast.error(msg);
    }
  };

  const handleSaveConfig = async () => {
    if (formData.status === "ACTIVE") {
      if ((formData.allowedDomains?.length ?? 0) === 0) {
        toast.error("At least one claimed email domain is required to activate SSO");
        return;
      }
      if (formData.providerType === "SAML" && (!formData.idpEntityId || !formData.idpSsoUrl)) {
        toast.error("IdP Entity ID and SSO URL are required for SAML");
        return;
      }
    }

    try {
      await updateConfig.mutateAsync({
        providerType: formData.providerType,
        status: formData.status,
        idpEntityId: formData.idpEntityId || null,
        idpSsoUrl: formData.idpSsoUrl || null,
        idpCertificate: formData.idpCertificate || null,
        oidcClientId: formData.oidcClientId || null,
        oidcClientSecret: formData.oidcClientSecret || null,
        oidcDiscoveryUrl: formData.oidcDiscoveryUrl || null,
        enforceSso: formData.enforceSso,
        allowedDomains: formData.allowedDomains,
        jitProvisioning: formData.jitProvisioning,
      });
      toast.success("SSO configuration updated successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update SSO configuration";
      toast.error(msg);
    }
  };

  const handleCreateScimToken = async () => {
    if (!newTokenName.trim()) {
      toast.error("Token name is required");
      return;
    }

    try {
      const allowedIps = newTokenAllowedIps
        .split(",")
        .map((ip) => ip.trim())
        .filter(Boolean);

      const res = await createScimToken.mutateAsync({
        name: newTokenName.trim(),
        expiresInDays: newTokenExpiryDays || 365,
        allowedIps,
      });
      setGeneratedRawToken(res.rawToken);
      setNewTokenName("");
      setNewTokenAllowedIps("");
      toast.success("SCIM token created");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate SCIM token";
      toast.error(msg);
    }
  };

  const handleRotateScimToken = async () => {
    if (!selectedTokenForRotate) return;

    try {
      const res = await rotateScimToken.mutateAsync({
        tokenId: selectedTokenForRotate.id,
        expiresInDays: rotateExpiryDays || 365,
      });
      setRotatedRawToken(res.rawToken);
      toast.success(`SCIM token "${selectedTokenForRotate.name}" rotated successfully`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to rotate token";
      toast.error(msg);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to revoke this SCIM token? Any IdP sync using this token will stop working immediately.",
      )
    ) {
      return;
    }
    try {
      await revokeScimToken.mutateAsync(tokenId);
      toast.success("SCIM token revoked");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to revoke token";
      toast.error(msg);
    }
  };

  const copyToClipboard = (text: string, label = "Copied to clipboard") => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const scimBaseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/v1/scim/v2`
      : "https://api.yourdomain.com/api/v1/scim/v2";

  return (
    <div className="space-y-6">
      {/* Plan Entitlement Warning if not Enterprise */}
      {!isEnterprise && (
        <Alert
          variant="default"
          className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20"
        >
          <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-900 dark:text-amber-200">
            Enterprise Plan Required
          </AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            SAML 2.0 / OIDC Single Sign-On and SCIM 2.0 Directory Sync are exclusive features of the
            Enterprise tier.{" "}
            <Link href={tenantHref("/settings/billing")} className="font-semibold underline">
              Upgrade to Enterprise
            </Link>{" "}
            to enable SAML, Okta, Azure AD / Entra ID, and automated SCIM provisioning.
          </AlertDescription>
        </Alert>
      )}

      {/* Enterprise SSO Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  Enterprise Single Sign-On (SSO)
                </CardTitle>
                <Badge variant={formData.status === "ACTIVE" ? "default" : "secondary"}>
                  {formData.status}
                </Badge>
              </div>
              <CardDescription>
                Authenticate members via your corporate Identity Provider (Okta, Azure AD, Google
                Workspace, OneLogin).
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sso-status-toggle" className="text-xs">
                Enable SSO
              </Label>
              <Switch
                id="sso-status-toggle"
                checked={formData.status === "ACTIVE"}
                onCheckedChange={(checked: boolean) =>
                  updateField("status", checked ? "ACTIVE" : "DISABLED")
                }
                disabled={!isEnterprise}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs
            value={formData.providerType}
            onValueChange={(val: string) => updateField("providerType", val as SsoProviderType)}
          >
            <TabsList className="grid w-64 grid-cols-2">
              <TabsTrigger value="SAML" disabled={!isEnterprise}>
                SAML 2.0
              </TabsTrigger>
              <TabsTrigger value="OIDC" disabled={!isEnterprise}>
                OpenID Connect
              </TabsTrigger>
            </TabsList>

            {/* SAML Tab */}
            <TabsContent value="SAML" className="mt-4 space-y-4">
              {/* Service Provider (SP) Configuration details for Okta / Azure AD */}
              {ssoConfig?.acsUrl && (
                <div className="border-border/50 bg-muted/40 space-y-2 rounded-md border p-3 text-xs">
                  <div className="text-foreground flex items-center justify-between font-semibold">
                    <span>Service Provider (SP) Configuration for IdP Setup</span>
                    {ssoConfig.metadataUrl && (
                      <a
                        href={ssoConfig.metadataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary text-[11px] hover:underline"
                      >
                        View SP Metadata XML
                      </a>
                    )}
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="bg-background/80 flex items-center justify-between rounded border px-2 py-1">
                      <span className="text-muted-foreground mr-2 font-sans text-xs font-medium">
                        SP Entity ID:
                      </span>
                      <span className="truncate">{ssoConfig.spEntityId}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-1.5 h-6 w-6 shrink-0 p-0"
                        onClick={() => copyToClipboard(ssoConfig.spEntityId || "")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="bg-background/80 flex items-center justify-between rounded border px-2 py-1">
                      <span className="text-muted-foreground mr-2 font-sans text-xs font-medium">
                        ACS URL:
                      </span>
                      <span className="truncate">{ssoConfig.acsUrl}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-1.5 h-6 w-6 shrink-0 p-0"
                        onClick={() => copyToClipboard(ssoConfig.acsUrl || "")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">IdP Entity ID / Issuer URL</Label>
                <Input
                  placeholder="https://idp.okta.com/exk123abc456"
                  value={formData.idpEntityId}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField("idpEntityId", e.target.value)
                  }
                  disabled={!isEnterprise}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">IdP Single Sign-On (SSO) URL</Label>
                <Input
                  placeholder="https://idp.okta.com/app/exk123abc456/sso/saml"
                  value={formData.idpSsoUrl}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField("idpSsoUrl", e.target.value)
                  }
                  disabled={!isEnterprise}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">X.509 Public Certificate</Label>
                <Textarea
                  rows={4}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCg...&#10;-----END CERTIFICATE-----"
                  className="font-mono text-xs"
                  value={formData.idpCertificate}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    updateField("idpCertificate", e.target.value)
                  }
                  disabled={!isEnterprise}
                />
              </div>
            </TabsContent>

            {/* OIDC Tab */}
            <TabsContent value="OIDC" className="mt-4 space-y-4">
              {ssoConfig?.oidcCallbackUrl && (
                <div className="border-border/50 bg-muted/40 space-y-1.5 rounded-md border p-3 text-xs">
                  <div className="text-foreground font-semibold">
                    Authorized Redirect URI for OIDC Provider
                  </div>
                  <div className="bg-background/80 flex items-center justify-between rounded border px-2 py-1 font-mono text-[11px]">
                    <span className="text-muted-foreground mr-2 font-sans text-xs font-medium">
                      Callback URL:
                    </span>
                    <span className="truncate">{ssoConfig.oidcCallbackUrl}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1.5 h-6 w-6 shrink-0 p-0"
                      onClick={() => copyToClipboard(ssoConfig.oidcCallbackUrl || "")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">OIDC Discovery URL (Well-Known)</Label>
                <Input
                  placeholder="https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration"
                  value={formData.oidcDiscoveryUrl}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField("oidcDiscoveryUrl", e.target.value)
                  }
                  disabled={!isEnterprise}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Client ID</Label>
                  <Input
                    placeholder="00000000-0000-0000-0000-000000000000"
                    value={formData.oidcClientId}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateField("oidcClientId", e.target.value)
                    }
                    disabled={!isEnterprise}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Client Secret</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={formData.oidcClientSecret}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateField("oidcClientSecret", e.target.value)
                    }
                    disabled={!isEnterprise}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Claimed Domains */}
          <div className="space-y-3 border-t pt-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Claimed Email Domains</Label>
              <p className="text-muted-foreground text-xs">
                Users attempting to log in with these email domains will automatically route to this
                workspace&apos;s SSO.
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="acme.com"
                value={newDomainInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewDomainInput(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddDomain();
                  }
                }}
                disabled={!isEnterprise}
                className="max-w-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddDomain}
                disabled={!isEnterprise}
              >
                <Plus className="mr-1 size-3.5" />
                Add Domain
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {formData.allowedDomains?.map((domain) => (
                <Badge key={domain} variant="secondary" className="gap-1 px-2.5 py-1">
                  {domain}
                  <button
                    type="button"
                    onClick={() => handleRemoveDomain(domain)}
                    className="hover:text-destructive text-muted-foreground ml-1"
                    aria-label={`Remove domain ${domain}`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {(!formData.allowedDomains || formData.allowedDomains.length === 0) && (
                <span className="text-muted-foreground text-xs italic">
                  No domains claimed yet.
                </span>
              )}
            </div>
          </div>

          {/* Policy Toggles */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium">Enforce Single Sign-On</Label>
                <p className="text-muted-foreground text-xs">
                  Require all users with claimed email domains to authenticate via SSO (blocks
                  password login).
                </p>
              </div>
              <Switch
                checked={formData.enforceSso}
                onCheckedChange={(checked: boolean) => updateField("enforceSso", checked)}
                disabled={!isEnterprise}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium">Just-In-Time (JIT) Provisioning</Label>
                <p className="text-muted-foreground text-xs">
                  Automatically create workspace member accounts on their first successful SSO
                  login.
                </p>
              </div>
              <Switch
                checked={formData.jitProvisioning}
                onCheckedChange={(checked: boolean) => updateField("jitProvisioning", checked)}
                disabled={!isEnterprise}
              />
            </div>
          </div>

          {/* Test Connection Result Alert */}
          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"}>
              {testResult.success ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <AlertCircle className="size-4" />
              )}
              <AlertTitle>{testResult.success ? "Connection Valid" : "Test Failed"}</AlertTitle>
              <AlertDescription className="text-xs">{testResult.message}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={!isEnterprise || testConnection.isPending}
            >
              {testConnection.isPending ? "Testing..." : "Test Connection"}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSaveConfig}
              disabled={!isEnterprise || updateConfig.isPending}
            >
              {updateConfig.isPending ? "Saving..." : "Save SSO Configuration"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SCIM 2.0 Directory Sync Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">SCIM 2.0 Directory Sync</CardTitle>
              <CardDescription>
                Automate member provisioning, profile updates, and deprovisioning directly from
                Okta, Azure AD, or OneLogin.
              </CardDescription>
            </div>
            <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!isEnterprise}>
                  <KeyRound className="mr-1.5 size-3.5" />
                  Generate SCIM Token
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate SCIM 2.0 Bearer Token</DialogTitle>
                  <DialogDescription>
                    This token is used by your Identity Provider to authenticate SCIM requests.
                  </DialogDescription>
                </DialogHeader>

                {!generatedRawToken ? (
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Token Name</Label>
                      <Input
                        placeholder="e.g. Okta SCIM Production"
                        value={newTokenName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setNewTokenName(e.target.value)
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Expiration (Days)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          value={newTokenExpiryDays}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setNewTokenExpiryDays(Number(e.target.value) || 365)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Allowed IPs (Optional)</Label>
                        <Input
                          placeholder="e.g. 54.210.1.2, 52.1.2.3"
                          value={newTokenAllowedIps}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setNewTokenAllowedIps(e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
                      <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
                      <AlertTitle className="text-amber-900 dark:text-amber-200">
                        Copy this token now
                      </AlertTitle>
                      <AlertDescription className="text-xs text-amber-800 dark:text-amber-300">
                        For security reasons, this token will never be displayed again.
                      </AlertDescription>
                    </Alert>

                    <div className="flex items-center gap-2">
                      <Input readOnly value={generatedRawToken} className="font-mono text-xs" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(generatedRawToken, "SCIM token copied")}
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  {!generatedRawToken ? (
                    <Button
                      type="button"
                      onClick={handleCreateScimToken}
                      disabled={createScimToken.isPending}
                    >
                      {createScimToken.isPending ? "Generating..." : "Generate Token"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => {
                        setGeneratedRawToken(null);
                        setIsTokenDialogOpen(false);
                      }}
                    >
                      Done
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Base SCIM URL */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">SCIM 2.0 Base URL</Label>
            <div className="flex max-w-md items-center gap-2">
              <Input readOnly value={scimBaseUrl} className="font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(scimBaseUrl, "SCIM URL copied")}
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Provide this Base URL and your SCIM Bearer token in your IdP&apos;s SCIM application
              settings.
            </p>
          </div>

          {/* Tokens Table */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-xs font-medium">Active SCIM Bearer Tokens</Label>
            {isLoadingTokens ? (
              <div className="text-muted-foreground py-4 text-center text-xs">
                Loading tokens...
              </div>
            ) : (scimTokens?.length ?? 0) === 0 ? (
              <div className="text-muted-foreground rounded-md border p-6 text-center text-xs">
                No active SCIM tokens. Generate a token to enable directory sync.
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Token Prefix</th>
                      <th className="px-3 py-2 font-medium">Created</th>
                      <th className="px-3 py-2 font-medium">Expires</th>
                      <th className="px-3 py-2 font-medium">Last Used</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {scimTokens?.map((token) => (
                      <tr key={token.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2.5 font-medium">
                          <div>{token.name}</div>
                          {token.allowedIps && token.allowedIps.length > 0 && (
                            <div className="text-muted-foreground text-[10px]">
                              IPs: {token.allowedIps.join(", ")}
                            </div>
                          )}
                        </td>
                        <td className="text-muted-foreground px-3 py-2.5 font-mono text-[11px]">
                          {token.tokenPrefix}
                        </td>
                        <td className="text-muted-foreground px-3 py-2.5">
                          {new Date(token.createdAt).toLocaleDateString()}
                        </td>
                        <td className="text-muted-foreground px-3 py-2.5">
                          {token.expiresAt
                            ? new Date(token.expiresAt).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="text-muted-foreground px-3 py-2.5">
                          {token.lastUsedAt ? (
                            <div>
                              <div>{new Date(token.lastUsedAt).toLocaleDateString()}</div>
                              {token.lastUsedIp && (
                                <div className="text-muted-foreground font-mono text-[10px]">
                                  {token.lastUsedIp}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60 italic">Never</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant={token.status === "ACTIVE" ? "default" : "secondary"}>
                            {token.status}
                          </Badge>
                        </td>
                        <td className="space-x-1 px-3 py-2.5 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground h-7 px-2"
                            onClick={() => {
                              setSelectedTokenForRotate({ id: token.id, name: token.name });
                              setRotatedRawToken(null);
                              setIsRotateDialogOpen(true);
                            }}
                            disabled={token.status !== "ACTIVE" || rotateScimToken.isPending}
                          >
                            <RefreshCw className="mr-1 size-3.5" />
                            Rotate
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive h-7 px-2"
                            onClick={() => handleRevokeToken(token.id)}
                            disabled={revokeScimToken.isPending}
                          >
                            <Trash2 className="mr-1 size-3.5" />
                            Revoke
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* IdP Setup Documentation Quick Links */}
          <div className="bg-muted/20 space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>Identity Provider Integration Quick Guide</span>
            </div>
            <div className="text-muted-foreground grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
              <div className="space-y-1">
                <span className="text-foreground font-medium">Okta SCIM 2.0 Integration:</span>
                <p>
                  1. In Okta Admin Console, navigate to Applications &gt; Add SCIM 2.0 Test App.
                </p>
                <p>
                  2. Set SCIM connector base URL to:{" "}
                  <code className="text-foreground font-mono text-[11px]">{scimBaseUrl}</code>
                </p>
                <p>
                  3. Unique identifier field for users:{" "}
                  <code className="text-foreground font-mono text-[11px]">userName</code> (email).
                </p>
                <p>4. Authentication Mode: HTTP Header (Authorization: Bearer &lt;Token&gt;).</p>
              </div>
              <div className="space-y-1">
                <span className="text-foreground font-medium">Microsoft Entra ID (Azure AD):</span>
                <p>1. In Entra ID Enterprise Applications, select Provisioning &gt; Automatic.</p>
                <p>
                  2. Set Tenant URL to:{" "}
                  <code className="text-foreground font-mono text-[11px]">{scimBaseUrl}</code>
                </p>
                <p>3. Set Secret Token to your generated SCIM Bearer Token.</p>
                <p>4. Click Test Connection to verify directory schema synchronization.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rotate SCIM Token Dialog */}
      <Dialog open={isRotateDialogOpen} onOpenChange={setIsRotateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotate SCIM Bearer Token</DialogTitle>
            <DialogDescription>
              {selectedTokenForRotate && (
                <>
                  Rotating <strong>{selectedTokenForRotate.name}</strong> will invalidate the
                  previous credentials. A new Bearer token will be generated immediately.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {!rotatedRawToken ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">New Token Expiry (Days)</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={rotateExpiryDays}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setRotateExpiryDays(Number(e.target.value) || 365)
                  }
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
                <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-amber-900 dark:text-amber-200">
                  Copy this rotated token now
                </AlertTitle>
                <AlertDescription className="text-xs text-amber-800 dark:text-amber-300">
                  Update your IdP configuration with this new token immediately. For security
                  reasons, this token will not be displayed again.
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-2">
                <Input readOnly value={rotatedRawToken} className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(rotatedRawToken, "Rotated SCIM token copied")}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            {!rotatedRawToken ? (
              <Button
                type="button"
                onClick={handleRotateScimToken}
                disabled={rotateScimToken.isPending}
              >
                {rotateScimToken.isPending ? "Rotating..." : "Rotate Token"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  setRotatedRawToken(null);
                  setSelectedTokenForRotate(null);
                  setIsRotateDialogOpen(false);
                }}
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
