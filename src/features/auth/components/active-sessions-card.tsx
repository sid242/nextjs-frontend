"use client";

import { LaptopIcon, LogOutIcon, SmartphoneIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/errors";
import { formatDate } from "@/lib/format";

import { useRevokeSession, useUserSessions } from "../queries";

export function ActiveSessionsCard() {
  const { data: sessions = [], isLoading } = useUserSessions();
  const revokeSessionMutation = useRevokeSession();

  const handleRevoke = async (id: string) => {
    try {
      const res = (await revokeSessionMutation.mutateAsync(id)) as { message?: string } | undefined;
      toast.success(res?.message ?? "Device session revoked successfully.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Active Device Sessions</CardTitle>
        <CardDescription className="text-xs">
          Devices and browsers that are currently authenticated to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="text-muted-foreground animate-pulse p-6 text-center text-xs">
            Loading active sessions…
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-muted-foreground p-6 text-center text-xs">
            No other active sessions found.
          </div>
        ) : (
          <div className="divide-border/50 divide-y">
            {sessions.map((session) => {
              const isMobile =
                session.userAgent?.toLowerCase().includes("mobile") ||
                session.userAgent?.toLowerCase().includes("android") ||
                session.userAgent?.toLowerCase().includes("iphone");

              return (
                <div
                  key={session.id}
                  className="hover:bg-accent/30 flex flex-col gap-2 px-4 py-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
                      {isMobile ? (
                        <SmartphoneIcon className="size-4" />
                      ) : (
                        <LaptopIcon className="size-4" />
                      )}
                    </div>
                    <div className="grid leading-tight">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-xs font-semibold">
                          {session.userAgent || "Web Browser"}
                        </span>
                        {session.isCurrent && (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-600"
                          >
                            Current Device
                          </Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground text-[11px]">
                        IP: <span className="font-mono">{session.ipAddress ?? "Unknown"}</span> •
                        Last active {formatDate(session.lastActiveAt)}
                      </span>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(session.id)}
                      disabled={revokeSessionMutation.isPending}
                      className="text-muted-foreground hover:text-destructive h-8 gap-1.5 text-xs"
                    >
                      <LogOutIcon className="size-3.5" /> Revoke
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
