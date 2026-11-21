"use client";

import { useState } from "react";
import { Activity, Calendar, FileText, Key, Shield, User, Webhook } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveTenant } from "@/features/tenants";
import { formatDateTime, initials } from "@/lib/format";

import { useActivityFeed } from "../queries";

const ENTITY_ICONS: Record<string, React.ElementType> = {
  member: User,
  user: User,
  file: FileText,
  api_key: Key,
  webhook: Webhook,
  role: Shield,
  settings: Shield,
};

export function ActivityFeedTimeline() {
  const { activeTenantId } = useActiveTenant();
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useActivityFeed(activeTenantId, {
    limit: 50,
    entityType: selectedEntity || undefined,
  });

  const filterButtons = [
    { label: "All Events", value: "" },
    { label: "Members", value: "member" },
    { label: "Files", value: "file" },
    { label: "API Keys", value: "api_key" },
    { label: "Webhooks", value: "webhook" },
    { label: "Roles", value: "role" },
  ];

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-col justify-between gap-2 pb-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Activity className="text-primary size-4" /> Workspace Activity Timeline
          </CardTitle>
          <CardDescription className="text-xs">
            Recent actions and audit events across members, resources, and settings.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {filterButtons.map((btn) => (
            <Button
              key={btn.value}
              variant={selectedEntity === btn.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedEntity(btn.value)}
              className="h-7 px-2.5 text-xs"
            >
              {btn.label}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="ml-1 h-7 px-2.5 text-xs"
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-destructive py-4 text-xs">Failed to load activity timeline.</p>
        ) : items?.length === 0 ? (
          <div className="text-muted-foreground py-10 text-center text-xs">
            No activity events recorded yet.
          </div>
        ) : (
          <div className="border-border/60 relative my-2 ml-4 space-y-4 border-l pl-4">
            {items?.map((item) => {
              const Icon = ENTITY_ICONS[item.entityType.toLowerCase()] ?? Activity;
              return (
                <div key={item.id} className="group relative">
                  {/* Timeline dot */}
                  <div className="bg-primary/70 ring-background absolute top-1.5 -left-[22px] size-2.5 rounded-full ring-4" />

                  <div className="bg-muted/20 hover:bg-muted/40 border-border/40 flex items-start justify-between gap-3 rounded-lg border p-2.5 transition-colors">
                    <div className="flex items-start gap-2.5">
                      <Avatar className="mt-0.5 size-7">
                        {item.actorAvatarUrl ? (
                          <AvatarImage src={item.actorAvatarUrl} alt={item.actorName ?? "Actor"} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                          {initials(item.actorName ?? "User")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <div className="text-foreground flex flex-wrap items-center gap-1.5 text-xs font-medium">
                          <span className="text-foreground font-semibold">
                            {item.actorName ?? "System"}
                          </span>
                          <span className="text-muted-foreground">{item.summary}</span>
                        </div>
                        <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {formatDateTime(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className="px-1.5 py-0 font-mono text-[10px] uppercase"
                      >
                        <Icon className="text-muted-foreground mr-1 size-2.5" />
                        {item.entityType}
                      </Badge>
                      <Badge variant="secondary" className="px-1.5 py-0 font-mono text-[10px]">
                        {item.verb}
                      </Badge>
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
