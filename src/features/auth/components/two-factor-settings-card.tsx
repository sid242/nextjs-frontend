"use client";

import { useState } from "react";
import { Loader2Icon, ShieldAlertIcon, ShieldCheckIcon, SmartphoneIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

import { useTwoFactorStatus } from "../queries";
import { TwoFactorDisableDialog } from "./two-factor-disable-dialog";
import { TwoFactorSetupDialog } from "./two-factor-setup-dialog";

export function TwoFactorSettingsCard() {
  const [setupOpen, setSetupOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);

  const { data: status, isLoading, refetch } = useTwoFactorStatus();

  const isEnabled = Boolean(status?.enabled);

  return (
    <>
      <Card className="border-border/60 shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SmartphoneIcon className="text-muted-foreground size-5" />
              <CardTitle className="text-base font-semibold">Two-Factor Authentication</CardTitle>
            </div>
            {isLoading ? (
              <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
            ) : isEnabled ? (
              <Badge
                variant="outline"
                className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400"
              >
                <ShieldCheckIcon className="size-3" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="outline" className="border-muted text-muted-foreground gap-1 text-xs">
                <ShieldAlertIcon className="size-3" />
                Disabled
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            Protect your account with an extra security layer. Whenever you sign in, you will be
            prompted for a 6-digit one-time code from your authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-border/50 bg-muted/20 flex flex-col items-start justify-between gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isEnabled ? "Authenticator App (TOTP)" : "Protect Your Account"}
              </p>
              <p className="text-muted-foreground text-xs">
                {isEnabled
                  ? `Active on your account${status?.enabledAt ? ` since ${formatDate(status.enabledAt)}` : ""}.`
                  : "Use Google Authenticator, Authy, or Microsoft Authenticator to generate verification codes."}
              </p>
            </div>

            <div className="shrink-0">
              {isEnabled ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                  onClick={() => setDisableOpen(true)}
                >
                  Disable 2FA
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={() => setSetupOpen(true)}>
                  Enable 2FA
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <TwoFactorSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onSuccess={() => refetch()}
      />

      <TwoFactorDisableDialog
        open={disableOpen}
        onOpenChange={setDisableOpen}
        onSuccess={() => refetch()}
      />
    </>
  );
}
