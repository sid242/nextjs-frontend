"use client";

import { useState } from "react";
import {
  BarChart3Icon,
  InboxIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  MessageSquareIcon,
  PhoneCallIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { WhatsAppAccountTab } from "./whatsapp-account-tab";
import { WhatsAppCampaignsTab } from "./whatsapp-campaigns-tab";
import { WhatsAppContactsTab } from "./whatsapp-contacts-tab";
import { WhatsAppConversationsTab } from "./whatsapp-conversations-tab";
import { WhatsAppMessagesTab } from "./whatsapp-messages-tab";
import { WhatsAppOverviewTab } from "./whatsapp-overview-tab";
import { WhatsAppPhoneNumbersTab } from "./whatsapp-phone-numbers-tab";
import { WhatsAppTemplatesTab } from "./whatsapp-templates-tab";
import { WhatsAppUsageTab } from "./whatsapp-usage-tab";

export function WhatsAppSettingsView() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">WhatsApp Business Settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure Meta Cloud API credentials, phone numbers, message templates, customer inbox,
          and broadcast marketing.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60 flex h-auto w-full flex-wrap justify-start gap-1 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background gap-1.5">
            <LayoutDashboardIcon className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:bg-background gap-1.5">
            <Settings2Icon className="h-4 w-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="phone-numbers" className="data-[state=active]:bg-background gap-1.5">
            <PhoneCallIcon className="h-4 w-4" />
            <span>Phone Numbers</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-background gap-1.5">
            <MessageSquareIcon className="h-4 w-4" />
            <span>Templates</span>
          </TabsTrigger>
          <TabsTrigger value="conversations" className="data-[state=active]:bg-background gap-1.5">
            <InboxIcon className="h-4 w-4" />
            <span>Inbox</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="data-[state=active]:bg-background gap-1.5">
            <MessageSquareIcon className="h-4 w-4" />
            <span>Compose &amp; Logs</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-background gap-1.5">
            <MegaphoneIcon className="h-4 w-4" />
            <span>Campaigns</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-background gap-1.5">
            <UsersIcon className="h-4 w-4" />
            <span>Contacts</span>
          </TabsTrigger>
          <TabsTrigger value="usage" className="data-[state=active]:bg-background gap-1.5">
            <BarChart3Icon className="h-4 w-4" />
            <span>Usage &amp; Billing</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <WhatsAppOverviewTab onNavigate={setActiveTab} />
        </TabsContent>
        <TabsContent value="account">
          <WhatsAppAccountTab />
        </TabsContent>
        <TabsContent value="phone-numbers">
          <WhatsAppPhoneNumbersTab />
        </TabsContent>
        <TabsContent value="templates">
          <WhatsAppTemplatesTab />
        </TabsContent>
        <TabsContent value="conversations">
          <WhatsAppConversationsTab />
        </TabsContent>
        <TabsContent value="messages">
          <WhatsAppMessagesTab />
        </TabsContent>
        <TabsContent value="campaigns">
          <WhatsAppCampaignsTab />
        </TabsContent>
        <TabsContent value="contacts">
          <WhatsAppContactsTab />
        </TabsContent>
        <TabsContent value="usage">
          <WhatsAppUsageTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
