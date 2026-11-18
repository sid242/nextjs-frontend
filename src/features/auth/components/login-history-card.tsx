"use client";

import { useState } from "react";
import {
  CheckCircle2Icon,
  HistoryIcon,
  LockIcon,
  ShieldAlertIcon,
  XCircleIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

import { useLoginHistory } from "../queries";
import type { UserLoginEvent } from "../schemas";

function getResultBadge(result: UserLoginEvent["result"]) {
  switch (result) {
    case "SUCCESS":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2Icon className="size-3" />
          Success
        </Badge>
      );
    case "LOCKED":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-600 dark:text-amber-400"
        >
          <LockIcon className="size-3" />
          Locked
        </Badge>
      );
    case "MFA_FAILED":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-purple-500/20 bg-purple-500/10 text-[10px] text-purple-600 dark:text-purple-400"
        >
          <ShieldAlertIcon className="size-3" />
          MFA Failed
        </Badge>
      );
    case "FAILED":
    default:
      return (
        <Badge
          variant="outline"
          className="border-destructive/20 bg-destructive/10 text-destructive gap-1 text-[10px]"
        >
          <XCircleIcon className="size-3" />
          Failed
        </Badge>
      );
  }
}

export function LoginHistoryCard() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useLoginHistory(page, 8);

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <HistoryIcon className="text-muted-foreground size-5" />
          <CardTitle className="text-base font-semibold">Sign-in History</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Recent authentication attempts and device sign-ins on your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="text-muted-foreground animate-pulse p-6 text-center text-xs">
            Loading sign-in history…
          </div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground p-6 text-center text-xs">
            No recent sign-in events recorded.
          </div>
        ) : (
          <div className="divide-border/50 divide-y">
            {items.map((event) => {
              const location = [event.city, event.country].filter(Boolean).join(", ");

              return (
                <div
                  key={event.id}
                  className="hover:bg-accent/30 flex flex-col gap-2 px-4 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">{getResultBadge(event.result)}</div>
                    <div className="grid leading-tight">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-xs font-semibold">
                          {event.method.replace(/_/g, " ")}
                        </span>
                        {location && (
                          <span className="text-muted-foreground text-[11px] font-normal">
                            • {location}
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground text-[11px]">
                        IP: <span className="font-mono">{event.ip ?? "Unknown"}</span>
                        {event.userAgent ? ` • ${event.userAgent.slice(0, 45)}…` : ""}
                      </span>
                    </div>
                  </div>

                  <span className="text-muted-foreground shrink-0 text-[11px] sm:text-right">
                    {formatDate(event.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-border/50 flex items-center justify-between border-t px-4 py-2.5 sm:px-6">
            <span className="text-muted-foreground text-xs">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="h-7 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="h-7 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
