"use client";

import Link from "next/link";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
  InfoIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useActiveTenant } from "@/features/tenants";
import { cn } from "@/lib/utils";

import { useActiveAnnouncements, useDismissAnnouncement } from "../queries";
import type { Announcement, AnnouncementSeverity } from "../types";

function getSeverityConfig(severity: AnnouncementSeverity) {
  switch (severity) {
    case "INCIDENT":
      return {
        icon: AlertCircleIcon,
        containerClass: "border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-200",
        iconClass: "text-rose-600 dark:text-rose-400",
        badge: "Incident",
      };
    case "MAINTENANCE":
      return {
        icon: AlertTriangleIcon,
        containerClass: "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200",
        iconClass: "text-amber-600 dark:text-amber-400",
        badge: "Maintenance",
      };
    case "FEATURE":
      return {
        icon: SparklesIcon,
        containerClass:
          "border-purple-500/30 bg-purple-500/10 text-purple-950 dark:text-purple-200",
        iconClass: "text-purple-600 dark:text-purple-400",
        badge: "New Feature",
      };
    case "INFO":
    default:
      return {
        icon: InfoIcon,
        containerClass: "border-sky-500/30 bg-sky-500/10 text-sky-950 dark:text-sky-200",
        iconClass: "text-sky-600 dark:text-sky-400",
        badge: "Announcement",
      };
  }
}

export function AnnouncementBanner() {
  const { activeTenant } = useActiveTenant();
  const tenantId = activeTenant?.id;

  const { data: announcements } = useActiveAnnouncements(tenantId);
  const dismissMutation = useDismissAnnouncement(tenantId);

  const items = announcements ?? [];
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      {items.map((ann: Announcement) => {
        const config = getSeverityConfig(ann.severity);
        const Icon = config.icon;

        return (
          <div
            key={ann.id}
            className={cn(
              "flex items-center justify-between gap-3 border-b px-4 py-2.5 text-xs transition-colors",
              config.containerClass,
            )}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Icon className={cn("size-4 shrink-0", config.iconClass)} />
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-semibold">{ann.title}</span>
                <span className="text-muted-foreground hidden sm:inline">•</span>
                <span className="truncate opacity-90">{ann.body}</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {ann.link && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-[11px] hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <Link href={ann.link} target="_blank" rel="noopener noreferrer">
                    <span>Learn More</span>
                    <ExternalLinkIcon className="size-3" />
                  </Link>
                </Button>
              )}

              {ann.dismissible && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 hover:bg-black/10 dark:hover:bg-white/10"
                  onClick={() => dismissMutation.mutate(ann.id)}
                  aria-label="Dismiss announcement"
                >
                  <XIcon className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
