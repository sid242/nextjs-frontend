"use client";

import { useState } from "react";
import { SaveIcon } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

import { useNotificationPreferences, useUpdateNotificationPreferences } from "../queries";
import type { NotificationCategory, NotificationPreference } from "../schemas";

const CATEGORY_LABELS: Record<NotificationCategory, { label: string; description: string }> = {
  SECURITY: {
    label: "Security",
    description: "Sign-ins, password resets, and 2FA updates (email cannot be disabled)",
  },
  TEAM: {
    label: "Team & Chat",
    description: "Chat mentions, direct messages, workspace invites, and role updates",
  },
  BILLING: {
    label: "Billing",
    description: "Invoices, payment alerts, and subscription limit warnings",
  },
  FILES: {
    label: "Files & Storage",
    description: "Export completions and virus scan alerts",
  },
  ACCOUNT: {
    label: "Account & Privacy",
    description: "GDPR/data export completions and account notices",
  },
  SYSTEM: {
    label: "System Announcements",
    description: "Platform maintenance windows and release announcements",
  },
  PRODUCT: {
    label: "Product Updates",
    description: "Feature rollouts and workspace tips",
  },
};

export function NotificationPreferencesCard() {
  const { data: serverPrefs = [], isLoading } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const [drafts, setDrafts] = useState<NotificationPreference[] | null>(null);

  const prefs = drafts ?? serverPrefs;

  const updateItem = (category: NotificationCategory, patch: Partial<NotificationPreference>) => {
    const base = drafts ?? serverPrefs;
    setDrafts(base.map((p) => (p.category === category ? { ...p, ...patch } : p)));
  };

  const handleSave = async () => {
    try {
      await updatePrefs.mutateAsync(prefs);
      setDrafts(null);
      toast.success("Notification preferences saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save preferences.");
    }
  };

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Channel & Quiet Hours</CardTitle>
          <CardDescription className="mt-1 text-xs">
            Choose which event categories deliver via In-App, Email, and Browser Push notifications.
          </CardDescription>
        </div>

        <Button
          type="button"
          size="sm"
          disabled={!drafts || updatePrefs.isPending || isLoading}
          onClick={() => void handleSave()}
        >
          <SaveIcon className="mr-1.5 h-3.5 w-3.5" />
          {updatePrefs.isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-xs">Loading preferences...</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {prefs.map((pref) => {
              const meta = CATEGORY_LABELS[pref.category];
              const isSecurity = pref.category === "SECURITY";
              return (
                <div
                  key={pref.category}
                  className="flex flex-col gap-3 p-3.5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{meta.label}</span>
                      {isSecurity && (
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                          Email Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">{meta.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-xs">
                      <Switch
                        checked={pref.channelInApp}
                        onCheckedChange={(checked) =>
                          updateItem(pref.category, { channelInApp: checked })
                        }
                      />
                      <span>In-App</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs">
                      <Switch
                        checked={isSecurity ? true : pref.channelEmail}
                        disabled={isSecurity}
                        onCheckedChange={(checked) =>
                          updateItem(pref.category, { channelEmail: checked })
                        }
                      />
                      <span>Email</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium">
                      <Switch
                        checked={pref.channelPush}
                        onCheckedChange={(checked) =>
                          updateItem(pref.category, { channelPush: checked })
                        }
                      />
                      <span>Push</span>
                    </label>

                    <div className="flex items-center gap-1.5">
                      <Label className="text-muted-foreground text-[11px]">Digest</Label>
                      <Select
                        value={pref.digest}
                        onValueChange={(value) =>
                          updateItem(pref.category, {
                            digest: value as NotificationPreference["digest"],
                          })
                        }
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">Instant</SelectItem>
                          <SelectItem value="DAILY">Daily</SelectItem>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Label className="text-muted-foreground text-[11px]">Quiet</Label>
                      <Input
                        type="text"
                        placeholder="22:00"
                        maxLength={5}
                        value={pref.quietHoursStart ?? ""}
                        onChange={(e) =>
                          updateItem(pref.category, {
                            quietHoursStart: e.target.value.trim() || null,
                          })
                        }
                        className="h-7 w-16 px-2 text-xs"
                        aria-label={`${meta.label} quiet hours start`}
                      />
                      <span className="text-muted-foreground text-xs">&ndash;</span>
                      <Input
                        type="text"
                        placeholder="08:00"
                        maxLength={5}
                        value={pref.quietHoursEnd ?? ""}
                        onChange={(e) =>
                          updateItem(pref.category, {
                            quietHoursEnd: e.target.value.trim() || null,
                          })
                        }
                        className="h-7 w-16 px-2 text-xs"
                        aria-label={`${meta.label} quiet hours end`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
