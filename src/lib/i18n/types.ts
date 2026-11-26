export const SUPPORTED_LOCALE_CODES = ["en", "hi"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALE_CODES)[number];

export function isSupportedLocale(locale: unknown): locale is SupportedLocale {
  return (
    typeof locale === "string" && (SUPPORTED_LOCALE_CODES as readonly string[]).includes(locale)
  );
}

export interface LocaleInfo {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
  dir: "ltr" | "rtl";
}

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    dir: "ltr",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    dir: "ltr",
  },
];

export const DEFAULT_LOCALE: SupportedLocale = "en";

export interface CommonDictionary {
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  create: string;
  confirm: string;
  back: string;
  search: string;
  loading: string;
  error: string;
  success: string;
  refresh: string;
  actions: string;
  view: string;
  copy: string;
  copied: string;
  close: string;
  filter: string;
  clear: string;
  status: string;
  active: string;
  inactive: string;
  pending: string;
  upload: string;
  download: string;
  export: string;
  import: string;
  noData: string;
  showing: string;
  of: string;
  to: string;
  next: string;
  previous: string;
  language: string;
}

export interface NavDictionary {
  dashboard: string;
  team: string;
  members: string;
  roles: string;
  groups: string;
  settings: string;
  billing: string;
  auditLogs: string;
  apiKeys: string;
  webhooks: string;
  notifications: string;
  help: string;
  profile: string;
  logout: string;
  workspaces: string;
  platform: string;
  analytics: string;
  chat: string;
  files: string;
  emailTemplates: string;
  policies: string;
  whatsapp: string;
}

export interface DashboardDictionary {
  welcome: string;
  overview: string;
  activeMembers: string;
  pendingInvites: string;
  storageUsed: string;
  recentActivity: string;
  quickActions: string;
  viewAll: string;
  inviteMember: string;
  manageTeam: string;
}

export interface TeamDictionary {
  title: string;
  description: string;
  directory: string;
  orgChart: string;
  inviteMember: string;
  bulkImport: string;
  searchPlaceholder: string;
  allRoles: string;
  allDepartments: string;
  manager: string;
  directReports: string;
  noHierarchy: string;
  memberCount: string;
}

export interface SettingsDictionary {
  title: string;
  description: string;
  general: string;
  security: string;
  branding: string;
  domain: string;
  billing: string;
  members: string;
  integrations: string;
  language: string;
  localePreferences: string;
  notifications: string;
  sso: string;
  email: string;
  whatsapp: string;
  audit: string;
  access: string;
  developer: string;
}

export interface BillingDictionary {
  title: string;
  currentPlan: string;
  upgrade: string;
  manageSubscription: string;
  seatLimit: string;
  billingCycle: string;
}

export interface WhatsAppDictionary {
  title: string;
  description: string;
  overview: string;
  account: string;
  phoneNumbers: string;
  templates: string;
  inbox: string;
  composeLogs: string;
  campaigns: string;
  contacts: string;
  usageBilling: string;
  connectWhatsApp: string;
  disconnect: string;
  createTemplate: string;
  sendMessage: string;
  createCampaign: string;
  connected: string;
  disconnected: string;
  notConnected: string;
  status: string;
  phone: string;
  verified: string;
}

export interface TranslationSchema {
  common: CommonDictionary;
  nav: NavDictionary;
  dashboard: DashboardDictionary;
  team: TeamDictionary;
  settings: SettingsDictionary;
  billing: BillingDictionary;
  whatsapp?: WhatsAppDictionary;
}
