"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangleIcon,
  BellOffIcon,
  BellRingIcon,
  CheckCircle2Icon,
  LaptopIcon,
  SendIcon,
  SmartphoneIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

import type { PushScope } from "../api";
import {
  getActivePushSubscription,
  getPushSupportStatus,
  type PushSupportStatus,
} from "../push-client";
import {
  useDisableBrowserPush,
  useEnableBrowserPush,
  usePushDevices,
  usePushPublicKey,
  useRemovePushDevice,
  useSendTestPush,
} from "../queries";

function summarizeUserAgent(ua?: string | null): string {
  if (!ua) return "Browser device";
  if (ua.includes("Edg/")) return "Microsoft Edge";
  if (ua.includes("Firefox/")) return "Mozilla Firefox";
  if (ua.includes("Chrome/")) return "Google Chrome";
  if (ua.includes("Safari/")) return "Apple Safari";
  return ua.slice(0, 48);
}

interface PushSettingsCardProps {
  scope?: PushScope;
}

export function PushSettingsCard({ scope = "tenant" }: PushSettingsCardProps) {
  const [supportStatus, setSupportStatus] = useState<PushSupportStatus>("default");
  const [isSubscribedLocally, setIsSubscribedLocally] = useState(false);

  const { data: keyConfig, isLoading: keyLoading } = usePushPublicKey(scope);
  const { data: devices = [], isLoading: devicesLoading } = usePushDevices(scope);
  const enablePush = useEnableBrowserPush(scope);
  const disablePush = useDisableBrowserPush(scope);
  const removeDevice = useRemovePushDevice(scope);
  const testPush = useSendTestPush(scope);

  useEffect(() => {
    let active = true;
    void (async () => {
      const nextStatus = getPushSupportStatus();
      const sub = await getActivePushSubscription().catch(() => null);
      if (!active) return;
      setSupportStatus(nextStatus);
      setIsSubscribedLocally(Boolean(sub));
    })();
    return () => {
      active = false;
    };
  }, []);

  const refreshLocalState = async () => {
    setSupportStatus(getPushSupportStatus());
    const sub = await getActivePushSubscription().catch(() => null);
    setIsSubscribedLocally(Boolean(sub));
  };

  const handleEnable = async () => {
    try {
      await enablePush.mutateAsync();
      await refreshLocalState();
      toast.success("Push notifications enabled on this browser.");
    } catch (err) {
      await refreshLocalState();
      toast.error(err instanceof Error ? err.message : "Could not enable push notifications.");
    }
  };

  const handleDisable = async () => {
    try {
      await disablePush.mutateAsync();
      await refreshLocalState();
      toast.success("Push notifications disabled on this browser.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not disable push notifications.");
    }
  };

  const handleTest = async () => {
    try {
      const res = await testPush.mutateAsync();
      toast.success(`Test push queued for ${res.deviceCount} device(s).`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send test push.");
    }
  };

  const serverConfigured = Boolean(keyConfig?.enabled);
  const activeDevices = devices.filter((d) => !d.disabledAt);
  const canSubscribe =
    serverConfigured &&
    supportStatus !== "unsupported" &&
    supportStatus !== "ios-install-required" &&
    supportStatus !== "denied";

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Browser Push Notifications</CardTitle>
            {isSubscribedLocally ? (
              <Badge variant="success" className="gap-1 text-[11px]">
                <CheckCircle2Icon className="h-3 w-3" />
                Active on this browser
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[11px]">
                Inactive on this browser
              </Badge>
            )}
          </div>
          <CardDescription className="mt-1 text-xs">
            Receive real-time desktop and mobile browser alerts even when the tab is closed. Only
            generic alert titles are sent over push to protect sensitive content.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSubscribedLocally ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={testPush.isPending || activeDevices.length === 0}
                onClick={() => void handleTest()}
              >
                <SendIcon className="mr-1.5 h-3.5 w-3.5" />
                {testPush.isPending ? "Sending..." : "Send Test Push"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={disablePush.isPending}
                onClick={() => void handleDisable()}
              >
                <BellOffIcon className="mr-1.5 h-3.5 w-3.5" />
                {disablePush.isPending ? "Disabling..." : "Disable on Browser"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={!canSubscribe || keyLoading || enablePush.isPending}
              onClick={() => void handleEnable()}
            >
              <BellRingIcon className="mr-1.5 h-3.5 w-3.5" />
              {enablePush.isPending ? "Enabling..." : "Enable Push Notifications"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!keyLoading && !serverConfigured && (
          <Alert>
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Push delivery not configured</AlertTitle>
            <AlertDescription className="text-xs">
              This server has not configured VAPID push keys yet. In-app and email alerts remain
              active.
            </AlertDescription>
          </Alert>
        )}

        {supportStatus === "unsupported" && (
          <Alert>
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Unsupported browser</AlertTitle>
            <AlertDescription className="text-xs">
              This browser environment does not support Service Workers or the Web Push API.
            </AlertDescription>
          </Alert>
        )}

        {supportStatus === "ios-install-required" && (
          <Alert>
            <SmartphoneIcon className="h-4 w-4" />
            <AlertTitle>Add to Home Screen required on iOS</AlertTitle>
            <AlertDescription className="text-xs">
              On iOS Safari (16.4+), tap Share &rarr; <strong>Add to Home Screen</strong>, then open
              the installed app to enable Web Push notifications.
            </AlertDescription>
          </Alert>
        )}

        {supportStatus === "denied" && (
          <Alert variant="destructive">
            <BellOffIcon className="h-4 w-4" />
            <AlertTitle>Browser notification permission blocked</AlertTitle>
            <AlertDescription className="text-xs">
              Notifications are blocked for this site in your browser settings. Allow notifications
              in the address bar site permissions, then click Enable again.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold tracking-wider uppercase">
              Registered Devices ({devices.length}/10)
            </h4>
          </div>

          {devicesLoading ? (
            <p className="text-muted-foreground text-xs">Loading registered devices...</p>
          ) : devices.length === 0 ? (
            <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-xs">
              No push devices registered yet. Click &ldquo;Enable Push Notifications&rdquo; to
              subscribe this browser.
            </p>
          ) : (
            <div className="divide-y rounded-lg border">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                      {device.platform === "web" ? (
                        <LaptopIcon className="text-muted-foreground h-4 w-4" />
                      ) : (
                        <SmartphoneIcon className="text-muted-foreground h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-medium">
                          {summarizeUserAgent(device.userAgent)}
                        </span>
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px] uppercase">
                          {device.channel}
                        </Badge>
                        {device.disabledAt ? (
                          <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                            Disabled ({device.failureCount} failures)
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        Last active:{" "}
                        {device.lastUsedAt
                          ? formatDate(device.lastUsedAt)
                          : formatDate(device.createdAt)}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-7 px-2 text-xs"
                    disabled={removeDevice.isPending}
                    onClick={() => void removeDevice.mutateAsync(device.id)}
                  >
                    <Trash2Icon className="mr-1 h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
