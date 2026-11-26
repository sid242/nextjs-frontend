"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  FileTextIcon,
  InboxIcon,
  MegaphoneIcon,
  PhoneCallIcon,
  PlusCircleIcon,
  RadioIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import {
  whatsAppAccountQueryOptions,
  whatsAppConversationsQueryOptions,
  whatsAppPhoneNumbersQueryOptions,
  whatsAppTemplatesQueryOptions,
  whatsAppUsageSummaryQueryOptions,
} from "../queries";

interface WhatsAppOverviewTabProps {
  onNavigate: (tab: string) => void;
}

export function WhatsAppOverviewTab({ onNavigate }: WhatsAppOverviewTabProps) {
  const { data: account } = useQuery(whatsAppAccountQueryOptions());
  const { data: phoneNumbers = [] } = useQuery(whatsAppPhoneNumbersQueryOptions());
  const { data: templatesData } = useQuery(whatsAppTemplatesQueryOptions());
  const templates = templatesData?.items ?? [];
  const { data: conversations = [] } = useQuery(whatsAppConversationsQueryOptions());
  const { data: usage } = useQuery(whatsAppUsageSummaryQueryOptions());

  const isConnected = account?.connectionStatus === "CONNECTED";
  const approvedTemplates = templates.filter((t) => t.status === "APPROVED");
  const activeWindowConversations = conversations.filter(
    (c) =>
      c.customerServiceWindowExpiresAt && new Date(c.customerServiceWindowExpiresAt) > new Date(),
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <Card className="border-primary/20 from-primary/5 via-primary/10 bg-gradient-to-r to-transparent">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">WhatsApp Business Platform</h2>
              {isConnected ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
                >
                  <CheckCircle2Icon className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                  Active &amp; Connected
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/20"
                >
                  Action Required: Connect WABA
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              Official Meta Cloud API integration (Graph API v21.0+) supporting 2-way messaging,
              OTPs, rich templates, and broadcasts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isConnected ? (
              <Button onClick={() => onNavigate("account")} className="gap-1.5">
                <SparklesIcon className="h-4 w-4" />
                Connect WABA
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => onNavigate("conversations")}
                  className="gap-1.5"
                >
                  <InboxIcon className="h-4 w-4" />
                  Customer Inbox
                </Button>
                <Button onClick={() => onNavigate("messages")} className="gap-1.5">
                  <PlusCircleIcon className="h-4 w-4" />
                  Compose Message
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => onNavigate("phone-numbers")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Phone Numbers
            </CardTitle>
            <PhoneCallIcon className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{phoneNumbers.length}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {phoneNumbers.filter((p) => p.isEnabled).length} enabled for dispatch
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => onNavigate("templates")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Approved Templates
            </CardTitle>
            <FileTextIcon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedTemplates.length}</div>
            <p className="text-muted-foreground mt-1 text-xs">{templates.length} total created</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => onNavigate("conversations")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Active 24h Windows
            </CardTitle>
            <RadioIcon className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWindowConversations.length}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {conversations.length} total customer threads
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => onNavigate("usage")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Estimated Cost
            </CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{usage?.totalEstimatedCost || "0.00"}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {(usage?.totalMessages ?? 0).toLocaleString()} messages logged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Features &amp; Workflows</CardTitle>
            <CardDescription>Direct shortcuts to WhatsApp Business modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              type="button"
              onClick={() => onNavigate("templates")}
              className="hover:bg-muted/50 flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileTextIcon className="text-primary h-5 w-5" />
                <div>
                  <div className="text-sm font-medium">Visual Template Builder</div>
                  <div className="text-muted-foreground text-xs">
                    Build Header, Body, Footer, Buttons with live mobile phone preview
                  </div>
                </div>
              </div>
              <ChevronRightIcon className="text-muted-foreground h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate("conversations")}
              className="hover:bg-muted/50 flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <InboxIcon className="h-5 w-5 text-emerald-500" />
                <div>
                  <div className="text-sm font-medium">Customer Support Inbox</div>
                  <div className="text-muted-foreground text-xs">
                    2-way conversation management adhering to Meta&apos;s 24-hour service window
                  </div>
                </div>
              </div>
              <ChevronRightIcon className="text-muted-foreground h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate("campaigns")}
              className="hover:bg-muted/50 flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <MegaphoneIcon className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-sm font-medium">Broadcast Marketing Campaigns</div>
                  <div className="text-muted-foreground text-xs">
                    Batch deliver approved promotional templates to consented recipients
                  </div>
                </div>
              </div>
              <ChevronRightIcon className="text-muted-foreground h-4 w-4" />
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meta Platform Compliance &amp; Architecture</CardTitle>
            <CardDescription>Security and multi-tenant guarantee checklist</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2.5">
              <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <div>
                <span className="font-medium">Tenant Isolation:</span> Webhooks resolve tenant
                ownership strictly via platform central registry; tokens are encrypted at rest with
                AES-256-GCM.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <div>
                <span className="font-medium">24-Hour Customer Window:</span> Free-form text and
                media sending enforce the 24h Meta customer service window automatically.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <div>
                <span className="font-medium">Asynchronous Reliability:</span> Outbound queues and
                webhook ingestion run via BullMQ with automatic retries and exponential backoff.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <div>
                <span className="font-medium">Opt-in Consent Policy:</span> Marketing broadcast
                validation checks opt-in compliance before queuing batch jobs.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
