"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  LinkIcon,
  RefreshCwIcon,
  UnlinkIcon,
} from "lucide-react";

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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  useCompleteOnboardingMutation,
  useDisconnectAccountMutation,
  whatsAppAccountQueryOptions,
} from "../queries";

export function WhatsAppAccountTab() {
  const { data: account, isLoading, refetch } = useQuery(whatsAppAccountQueryOptions());
  const completeMutation = useCompleteOnboardingMutation();
  const disconnectMutation = useDisconnectAccountMutation();

  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [wabaId, setWabaId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);

  const isConnected = account?.connectionStatus === "CONNECTED";

  const handleConnect = async () => {
    if (!wabaId || !accessToken) return;
    try {
      await completeMutation.mutateAsync({
        state: "manual-setup",
        wabaId,
        displayName: displayName || "WhatsApp Business",
        accessToken,
      });
      setConnectModalOpen(false);
      setWabaId("");
      setDisplayName("");
      setAccessToken("");
    } catch {
      // Error handled by query/toast
    }
  };

  const handleDisconnect = async () => {
    if (!account) return;
    try {
      await disconnectMutation.mutateAsync(account.id);
      setDisconnectModalOpen(false);
    } catch {
      // Error handled by query/toast
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-muted-foreground flex items-center gap-2">
            <RefreshCwIcon className="h-4 w-4 animate-spin" />
            <span>Loading WhatsApp account details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>WhatsApp Business Account</CardTitle>
            <CardDescription>
              Connect your Meta WhatsApp Business Account (WABA) to send templates and communicate
              with customers.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge
                variant="outline"
                className="border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"
              >
                <CheckCircle2Icon className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <AlertCircleIcon className="mr-1 h-3.5 w-3.5 text-amber-500" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {isConnected && account ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs tracking-wider uppercase">
                  Business Display Name
                </Label>
                <p className="text-foreground text-base font-semibold">{account.displayName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs tracking-wider uppercase">
                  WABA ID
                </Label>
                <p className="text-foreground font-mono text-sm">{account.wabaId}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs tracking-wider uppercase">
                  Connection Status
                </Label>
                <p className="text-sm font-medium">{account.connectionStatus}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs tracking-wider uppercase">
                  Connected At
                </Label>
                <p className="text-muted-foreground text-sm">
                  {account.connectedAt ? new Date(account.connectedAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-muted-foreground mb-4 text-sm">
                No WhatsApp Business Account connected to this workspace. Connect your Meta Business
                assets to get started.
              </p>
              <Button onClick={() => setConnectModalOpen(true)}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Connect WhatsApp Account
              </Button>
            </div>
          )}

          {isConnected && (
            <div className="flex items-center justify-between border-t pt-4">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCwIcon className="mr-2 h-3.5 w-3.5" />
                Refresh Status
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDisconnectModalOpen(true)}>
                <UnlinkIcon className="mr-2 h-3.5 w-3.5" />
                Disconnect Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connect Modal */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect WhatsApp Business Account</DialogTitle>
            <DialogDescription>
              Enter your Meta WhatsApp Business Account credentials to integrate with the Cloud API.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="wabaId">WhatsApp Business Account ID (WABA ID)</Label>
              <Input
                id="wabaId"
                placeholder="e.g. 109823487654321"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Business Display Name</Label>
              <Input
                id="displayName"
                placeholder="e.g. Acme Realty Support"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">System User Access Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="EAAG..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Your token is encrypted using AES-256-GCM envelope encryption and never exposed to
                the frontend.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={completeMutation.isPending || !wabaId || !accessToken}
            >
              {completeMutation.isPending ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Modal */}
      <Dialog open={disconnectModalOpen} onOpenChange={setDisconnectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disconnect WhatsApp Account?</DialogTitle>
            <DialogDescription>
              Disconnecting will disable outgoing messaging and incoming webhooks for this
              workspace. You can reconnect at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
