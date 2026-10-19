"use client";

import { useState } from "react";
import { CheckCircle2Icon, KeyIcon, MailIcon, SendIcon, ServerIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useActiveTenant,
  useSaveTenantEmailConfig,
  useTenantEmailConfig,
  useTestTenantEmailConfig,
  type Tenant,
  type TenantEmailConfig,
} from "@/features/tenants";

function SmtpForm({
  config,
  activeTenant,
  activeTenantId,
}: {
  config: TenantEmailConfig;
  activeTenant?: Tenant;
  activeTenantId: string;
}) {
  const saveConfigMutation = useSaveTenantEmailConfig(activeTenantId);
  const testEmailMutation = useTestTenantEmailConfig(activeTenantId);

  const [host, setHost] = useState(config.host ?? "smtp.mailgun.org");
  const [port, setPort] = useState(config.port ?? 587);
  const [secure, setSecure] = useState(config.secure ?? false);
  const [user, setUser] = useState(config.user ?? "");
  const [password, setPassword] = useState("");
  const [fromEmail, setFromEmail] = useState(config.fromEmail ?? "notifications@company.com");
  const [fromName, setFromName] = useState(
    config.fromName ?? activeTenant?.name ?? "Acme Platform",
  );
  const [replyTo, setReplyTo] = useState(config.replyTo ?? "");

  const [testOpen, setTestOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");

  const handleSave = async () => {
    if (!host.trim() || !user.trim() || !fromEmail.trim()) {
      toast.error("Please fill in all required SMTP fields.");
      return;
    }
    try {
      await saveConfigMutation.mutateAsync({
        host: host.trim(),
        port: Number(port),
        secure,
        user: user.trim(),
        password: password || undefined,
        fromEmail: fromEmail.trim(),
        fromName: fromName.trim() || undefined,
        replyTo: replyTo.trim() || undefined,
        isEnabled: true,
      });
      toast.success("SMTP configuration saved successfully!");
    } catch {
      toast.error("Failed to save SMTP settings.");
    }
  };

  const handleTestEmail = async () => {
    if (!testRecipient.trim()) return;
    try {
      const res = await testEmailMutation.mutateAsync({
        targetEmail: testRecipient.trim(),
        host,
        port: Number(port),
        secure,
        user,
        password: password || undefined,
        fromEmail,
        fromName,
      });
      toast.success(res?.message ?? "Test email sent successfully!");
      setTestOpen(false);
    } catch {
      toast.error("Failed to send test email. Please verify credentials.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Dedicated SMTP Server</h2>
          <p className="text-muted-foreground text-xs">
            Configure outbound mail delivery for invitations, transactional alerts, and
            notifications in{" "}
            <span className="text-foreground font-medium">
              {activeTenant?.name ?? "your organization"}
            </span>
            .
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            onClick={() => setTestOpen(true)}
            className="w-full gap-2 sm:w-auto"
          >
            <SendIcon className="size-4" /> Send Test Email
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveConfigMutation.isPending}
            className="w-full gap-2 shadow-sm sm:w-auto"
          >
            {saveConfigMutation.isPending ? "Saving…" : "Save Configuration"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-medium">SMTP Server Status</CardDescription>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2Icon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {config?.isEnabled ? "Active & Configured" : "Default System Relay"}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {config?.isEnabled
                ? `Routing mail through ${config.host}:${config.port}`
                : "Using system default AWS SES relay fallback."}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-medium">Encryption & Security</CardDescription>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <KeyIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {secure ? "SSL / TLS Explicit" : "STARTTLS (Opportunistic)"}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Port {port} standard communication profile
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-medium">From Identity</CardDescription>
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
              <MailIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="truncate text-base font-bold">{fromEmail}</div>
            <p className="text-muted-foreground mt-1 truncate text-xs">{fromName}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ServerIcon className="text-muted-foreground size-5" />
            <CardTitle className="text-base font-semibold">Connection & Credentials</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Enter your mail provider (SendGrid, Mailgun, Postmark, AWS SES, or custom SMTP server)
            connection credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="smtp-host">SMTP Host *</Label>
              <Input
                id="smtp-host"
                placeholder="smtp.mailgun.org"
                value={host}
                onChange={(e) => setHost(e?.target?.value ?? "")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="smtp-port">Port *</Label>
              <Input
                id="smtp-port"
                type="number"
                placeholder="587"
                value={port}
                onChange={(e) => setPort(Number(e?.target?.value ?? 587))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="smtp-user">Username / API Key *</Label>
              <Input
                id="smtp-user"
                placeholder="postmaster@yourdomain.com"
                value={user}
                onChange={(e) => setUser(e?.target?.value ?? "")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="smtp-pass">
                Password / Secret Token{" "}
                {config.passwordConfigured && "(Leave blank to keep existing)"}
              </Label>
              <Input
                id="smtp-pass"
                type="password"
                placeholder={config.passwordConfigured ? "••••••••••••••••" : "Enter password"}
                value={password}
                onChange={(e) => setPassword(e?.target?.value ?? "")}
              />
            </div>
          </div>

          <div className="border-border/50 flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="smtp-secure" className="text-sm font-medium">
                Enforce SSL / TLS
              </Label>
              <p className="text-muted-foreground text-xs">
                Enable for implicit TLS connections on port 465. Keep disabled for STARTTLS on port
                587.
              </p>
            </div>
            <Switch id="smtp-secure" checked={secure} onCheckedChange={setSecure} />
          </div>

          <div className="border-border/40 border-t pt-4">
            <h3 className="mb-4 text-sm font-semibold">Sender Identity & Routing</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="from-email">Sender Email (From) *</Label>
                <Input
                  id="from-email"
                  type="email"
                  placeholder="notifications@yourdomain.com"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e?.target?.value ?? "")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="from-name">Sender Display Name</Label>
                <Input
                  id="from-name"
                  placeholder="Acme Platform"
                  value={fromName}
                  onChange={(e) => setFromName(e?.target?.value ?? "")}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="reply-to">Reply-To Address (Optional)</Label>
                <Input
                  id="reply-to"
                  type="email"
                  placeholder="support@yourdomain.com"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e?.target?.value ?? "")}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Email Modal */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SendIcon className="text-primary size-4" /> Send Diagnostic Test Email
            </DialogTitle>
            <DialogDescription>
              Dispatches a test message using the configured SMTP credentials to verify routing.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label htmlFor="target-email">Recipient Email Address</Label>
              <Input
                id="target-email"
                type="email"
                placeholder="your.email@company.com"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e?.target?.value ?? "")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTestEmail}
              disabled={!testRecipient.trim() || testEmailMutation.isPending}
            >
              {testEmailMutation.isPending ? "Dispatching…" : "Send Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function TenantSmtpCard() {
  const { activeTenant, activeTenantId } = useActiveTenant();
  const { data: config, isLoading } = useTenantEmailConfig(activeTenantId);

  if (isLoading || !config || !activeTenantId) {
    return (
      <Card className="border-border/60 shadow-xs">
        <CardContent className="text-muted-foreground animate-pulse p-8 text-center text-sm">
          Loading SMTP server configuration…
        </CardContent>
      </Card>
    );
  }

  return (
    <SmtpForm
      key={`${activeTenantId}-${config.host}`}
      config={config}
      activeTenant={activeTenant}
      activeTenantId={activeTenantId}
    />
  );
}
