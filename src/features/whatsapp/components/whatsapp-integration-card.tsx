"use client";

import Link from "next/link";
import { ArrowRightIcon, MessageSquareIcon, WebhookIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTenantContext } from "@/features/tenants";

import { WhatsAppAccountTab } from "./whatsapp-account-tab";
import { WhatsAppPhoneNumbersTab } from "./whatsapp-phone-numbers-tab";

export function WhatsAppIntegrationCard() {
  const { data: context } = useTenantContext();
  const tenantSlug = context?.tenant?.slug;
  const workspaceHref = tenantSlug ? `/w/${tenantSlug}/whatsapp` : "/whatsapp";

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/v1/whatsapp/webhook`
      : "https://your-domain.com/api/v1/whatsapp/webhook";

  return (
    <div className="space-y-6">
      {/* Workspace Hub Callout */}
      <Alert className="border-indigo-500/20 bg-indigo-500/5">
        <MessageSquareIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <AlertTitle className="font-semibold text-indigo-950 dark:text-indigo-200">
              WhatsApp Business Workspace
            </AlertTitle>
            <AlertDescription className="text-muted-foreground text-xs">
              This settings page configures API credentials, phone numbers, and webhook
              connectivity. To compose templates, run campaigns, or chat in the inbox, open the
              workspace module.
            </AlertDescription>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
          >
            <Link href={workspaceHref}>
              <span>Open Workspace Hub</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </Alert>

      {/* Meta Account Credentials & Onboarding */}
      <WhatsAppAccountTab />

      {/* Phone Numbers Management */}
      <WhatsAppPhoneNumbersTab />

      {/* Webhook Configuration Guide */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <WebhookIcon className="text-muted-foreground h-5 w-5" />
            <CardTitle>Meta Webhook Configuration</CardTitle>
          </div>
          <CardDescription>
            Register this webhook endpoint inside your Meta Developers App Dashboard to receive
            real-time message delivery receipts and customer replies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Callback URL</Label>
            <Input readOnly value={webhookUrl} className="bg-muted/50 font-mono text-xs" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Webhook Event Subscriptions</Label>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">messages</Badge>
              <Badge variant="secondary">message_template_status_update</Badge>
              <Badge variant="secondary">phone_number_quality_update</Badge>
              <Badge variant="secondary">account_update</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
