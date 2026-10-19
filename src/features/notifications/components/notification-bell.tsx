"use client";

import Link from "next/link";
import {
  AlertCircleIcon,
  AlertOctagonIcon,
  BellIcon,
  CheckCheckIcon,
  CheckCircle2Icon,
  InfoIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "../queries";
import type { NotificationType } from "../schemas";

const TYPE_ICONS: Record<NotificationType, typeof InfoIcon> = {
  info: InfoIcon,
  success: CheckCircle2Icon,
  warning: AlertCircleIcon,
  error: AlertOctagonIcon,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  info: "text-blue-500 bg-blue-500/10",
  success: "text-emerald-500 bg-emerald-500/10",
  warning: "text-amber-500 bg-amber-500/10",
  error: "text-rose-500 bg-rose-500/10",
};

export function NotificationBell() {
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label="View notifications"
        >
          <BellIcon className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-60" />
              <span className="relative">{unreadCount > 9 ? "9+" : unreadCount}</span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg sm:w-96">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[11px] font-semibold">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead.mutate()}
              className="text-muted-foreground hover:text-foreground h-auto p-1 text-xs"
            >
              <CheckCheckIcon className="mr-1 size-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="divide-border/40 max-h-80 divide-y overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-muted-foreground p-6 text-center text-sm">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = TYPE_ICONS[notification.type] ?? InfoIcon;
              const colorClass = TYPE_COLORS[notification.type] ?? TYPE_COLORS.info;

              const content = (
                <div
                  className={cn(
                    "hover:bg-muted/50 flex cursor-pointer items-start gap-3 p-3 transition-colors",
                    !notification.read && "bg-muted/20",
                  )}
                  onClick={() => {
                    if (!notification.read) markRead.mutate(notification.id);
                  }}
                >
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full p-1.5",
                      colorClass,
                    )}
                  >
                    <Icon className="size-full" />
                  </div>

                  <div className="grid flex-1 gap-1 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-xs leading-tight font-semibold",
                          !notification.read && "text-foreground",
                        )}
                      >
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <span className="size-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                      {notification.message}
                    </p>
                    <span className="text-muted-foreground/60 text-[10px]">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                </div>
              );

              return (
                <div key={notification.id}>
                  {notification.link ? (
                    <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                      <Link href={notification.link}>{content}</Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem className="p-0 focus:bg-transparent">
                      {content}
                    </DropdownMenuItem>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
