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
import { TENANT_PERMISSIONS } from "@/config/permissions";
import { TenantPermissionGate } from "@/features/tenants";
import { useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("whatsapp.title") || "WhatsApp Business Settings"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("whatsapp.description") ||
            "Configure Meta Cloud API credentials, phone numbers, message templates, customer inbox, and broadcast marketing."}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60 flex h-auto w-full flex-wrap justify-start gap-1 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background gap-1.5">
            <LayoutDashboardIcon className="h-4 w-4" />
            <span>{t("whatsapp.overview") || "Overview"}</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:bg-background gap-1.5">
            <Settings2Icon className="h-4 w-4" />
            <span>{t("whatsapp.account") || "Account"}</span>
          </TabsTrigger>
          <TabsTrigger value="phone-numbers" className="data-[state=active]:bg-background gap-1.5">
            <PhoneCallIcon className="h-4 w-4" />
            <span>{t("whatsapp.phoneNumbers") || "Phone Numbers"}</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-background gap-1.5">
            <MessageSquareIcon className="h-4 w-4" />
            <span>{t("whatsapp.templates") || "Templates"}</span>
          </TabsTrigger>
          <TabsTrigger value="conversations" className="data-[state=active]:bg-background gap-1.5">
            <InboxIcon className="h-4 w-4" />
            <span>{t("whatsapp.inbox") || "Inbox"}</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="data-[state=active]:bg-background gap-1.5">
            <MessageSquareIcon className="h-4 w-4" />
            <span>{t("whatsapp.composeLogs") || "Compose & Logs"}</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-background gap-1.5">
            <MegaphoneIcon className="h-4 w-4" />
            <span>{t("whatsapp.campaigns") || "Campaigns"}</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-background gap-1.5">
            <UsersIcon className="h-4 w-4" />
            <span>{t("whatsapp.contacts") || "Contacts"}</span>
          </TabsTrigger>
          <TabsTrigger value="usage" className="data-[state=active]:bg-background gap-1.5">
            <BarChart3Icon className="h-4 w-4" />
            <span>{t("whatsapp.usageBilling") || "Usage & Billing"}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TenantPermissionGate permission={TENANT_PERMISSIONS.WHATSAPP_ACCOUNT_READ}>
            <WhatsAppOverviewTab onNavigate={setActiveTab} />
          </TenantPermissionGate>
        </TabsContent>
        <TabsContent value="account">
          <TenantPermissionGate permission={TENANT_PERMISSIONS.WHATSAPP_ACCOUNT_READ}>
            <WhatsAppAccountTab />
          </TenantPermissionGate>
        </TabsContent>
        <TabsContent value="phone-numbers">
          <TenantPermissionGate permission={TENANT_PERMISSIONS.WHATSAPP_PHONE_NUMBER_READ}>
            <WhatsAppPhoneNumbersTab />
          </TenantPermissionGate>
        </TabsContent>
        <TabsContent value="templates">
          <TenantPermissionGate permission={TENANT_PERMISSIONS.WHATSAPP_TEMPLATE_READ}>
            <WhatsAppTemplatesTab />
          </TenantPermissionGate>
        </TabsContent>
        <TabsContent value="conversations">
          <TenantPermissionGate permission={TENANT_PERMISSIONS.WHATSAPP_CONVERSATION_READ}>
            <WhatsAppConversationsTab />
          </TenantPermissionGate>
        </TabsContent>
        <TabsContent value="messages">
          <TenantPermissionGate permission={TENANT_PERMISSIONS.WHATSAPP_MESSAGE_READ}>
            <WhatsAppMessagesTab />
          </TenantPermissionGate>
        </TabsContent>
        <TabsContent value="campaigns">
          <TenantPermissionGate permission={TENANT_PERMISSIONS.WHATSAPP_CAMPAIGN_READ}>
            <WhatsAppCampaignsTab />
          </TenantPermissionGate>
        </TabsContent>
        <TabsContent value="contacts">
          <TenantPermissionGate permission={TENANT_PERMISSIONS.WHATSAPP_CONTACT_READ}>
            <WhatsAppContactsTab />
          </TenantPermissionGate>
        </TabsContent>
        <TabsContent value="usage">
          <TenantPermissionGate permission={TENANT_PERMISSIONS.WHATSAPP_USAGE_READ}>
            <WhatsAppUsageTab />
          </TenantPermissionGate>
        </TabsContent>
      </Tabs>
    </div>
  );
}
