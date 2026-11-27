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
import {
  WHATSAPP_SETTINGS_PERMISSIONS,
  WHATSAPP_TAB_PERMISSIONS,
  type WhatsAppTab,
} from "@/config/permissions";
import { hasTenantPermission, TenantPermissionGate, useTenantContext } from "@/features/tenants";
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

const tabs = [
  { id: "overview", label: "whatsapp.overview", icon: LayoutDashboardIcon },
  { id: "account", label: "whatsapp.account", icon: Settings2Icon, Content: WhatsAppAccountTab },
  {
    id: "phone-numbers",
    label: "whatsapp.phoneNumbers",
    icon: PhoneCallIcon,
    Content: WhatsAppPhoneNumbersTab,
  },
  {
    id: "templates",
    label: "whatsapp.templates",
    icon: MessageSquareIcon,
    Content: WhatsAppTemplatesTab,
  },
  {
    id: "conversations",
    label: "whatsapp.inbox",
    icon: InboxIcon,
    Content: WhatsAppConversationsTab,
  },
  {
    id: "messages",
    label: "whatsapp.composeLogs",
    icon: MessageSquareIcon,
    Content: WhatsAppMessagesTab,
  },
  {
    id: "campaigns",
    label: "whatsapp.campaigns",
    icon: MegaphoneIcon,
    Content: WhatsAppCampaignsTab,
  },
  { id: "contacts", label: "whatsapp.contacts", icon: UsersIcon, Content: WhatsAppContactsTab },
  { id: "usage", label: "whatsapp.usageBilling", icon: BarChart3Icon, Content: WhatsAppUsageTab },
] as const;

export function WhatsAppSettingsView() {
  return (
    <TenantPermissionGate permission={WHATSAPP_SETTINGS_PERMISSIONS}>
      <WhatsAppSettingsTabs />
    </TenantPermissionGate>
  );
}

function WhatsAppSettingsTabs() {
  const [selectedTab, setSelectedTab] = useState<WhatsAppTab>("overview");
  const { t } = useTranslation();
  const { data: context } = useTenantContext();
  const canAccess = (tab: WhatsAppTab) =>
    hasTenantPermission(context?.permissions, WHATSAPP_TAB_PERMISSIONS[tab]);
  const visibleTabs = tabs.filter((tab) => canAccess(tab?.id));
  const activeTab = canAccess(selectedTab) ? selectedTab : visibleTabs?.[0]?.id;
  const navigate = (value: string) => {
    const allowedTab = visibleTabs.find((tab) => tab?.id === value);
    if (allowedTab) setSelectedTab(allowedTab?.id);
  };

  if (!activeTab) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("whatsapp.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("whatsapp.description")}</p>
      </div>
      <Tabs value={activeTab} onValueChange={navigate} className="space-y-6">
        <div className="w-full overflow-x-auto pb-1">
          <TabsList
            aria-label={t("whatsapp.title")}
            className="bg-muted/60 inline-flex h-auto w-max flex-nowrap items-center justify-start gap-1 p-1"
          >
            {visibleTabs.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="data-[state=active]:bg-background shrink-0 gap-1.5 whitespace-nowrap"
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                <span>{t(label)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {visibleTabs.map((tab) => (
          <TabsContent key={tab?.id} value={tab?.id}>
            {"Content" in tab ? (
              <tab.Content />
            ) : (
              <WhatsAppOverviewTab onNavigate={navigate} canAccess={canAccess} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
