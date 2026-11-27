"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3Icon, FileTextIcon, InboxIcon, PhoneCallIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WhatsAppTab } from "@/config/permissions";

import {
  whatsAppAccountQueryOptions,
  whatsAppConversationsQueryOptions,
  whatsAppPhoneNumbersQueryOptions,
  whatsAppTemplatesQueryOptions,
  whatsAppUsageSummaryQueryOptions,
} from "../queries";

interface WhatsAppOverviewTabProps {
  onNavigate: (tab: WhatsAppTab) => void;
  canAccess: (tab: WhatsAppTab) => boolean;
}

export function WhatsAppOverviewTab({ onNavigate, canAccess }: WhatsAppOverviewTabProps) {
  const {
    data: account,
    isPending: isAccountPending,
    isError: isAccountError,
  } = useQuery(whatsAppAccountQueryOptions());
  const { data: phoneNumbers } = useQuery({
    ...whatsAppPhoneNumbersQueryOptions(),
    enabled: canAccess("phone-numbers"),
  });
  const { data: templates } = useQuery({
    ...whatsAppTemplatesQueryOptions(),
    enabled: canAccess("templates"),
  });
  const { data: conversations, dataUpdatedAt: conversationsFetchedAt } = useQuery({
    ...whatsAppConversationsQueryOptions(),
    enabled: canAccess("conversations"),
  });
  const { data: usage } = useQuery({
    ...whatsAppUsageSummaryQueryOptions(),
    enabled: canAccess("usage"),
  });

  const tiles = [
    {
      tab: "phone-numbers",
      title: "Enabled sending numbers",
      icon: PhoneCallIcon,
      count: phoneNumbers?.filter((phone) => phone?.isEnabled)?.length,
    },
    {
      tab: "templates",
      title: "Approved templates",
      icon: FileTextIcon,
      count: templates?.items?.filter((template) => template?.status === "APPROVED")?.length,
    },
    {
      tab: "conversations",
      title: "Active conversation windows",
      icon: InboxIcon,
      count: conversations?.filter((conversation) => {
        const expiresAt = conversation?.customerServiceWindowExpiresAt;
        return expiresAt && Date.parse(expiresAt) > conversationsFetchedAt;
      })?.length,
    },
    {
      tab: "usage",
      title: "Messages logged",
      icon: BarChart3Icon,
      count: usage?.totalMessages,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Business account</CardTitle>
            <CardDescription>
              {isAccountError
                ? "Could not load the connection status."
                : account?.displayName || "Manage the account linked to this workspace."}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {isAccountPending
              ? "Checking connection"
              : isAccountError
                ? "Status unavailable"
                : account?.connectionStatus === "CONNECTED"
                  ? "Connected"
                  : "Not connected"}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => onNavigate("account")}>
            View account
          </Button>
          {canAccess("campaigns") && (
            <Button type="button" variant="outline" onClick={() => onNavigate("campaigns")}>
              View campaigns
            </Button>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles
          .filter((tile) => canAccess(tile?.tab))
          .map(({ tab, title, icon: Icon, count }) => (
            <Button
              key={tab}
              type="button"
              variant="outline"
              className="border-border/80 h-auto min-h-24 flex-col items-start justify-between gap-3 rounded-2xl p-4 text-left shadow-xs"
              onClick={() => onNavigate(tab)}
            >
              <span className="text-muted-foreground flex items-center gap-2 whitespace-normal">
                <Icon aria-hidden="true" className="size-4" />
                {title}
              </span>
              <span className="text-2xl font-semibold">{count?.toLocaleString() ?? "—"}</span>
            </Button>
          ))}
      </div>
    </div>
  );
}
