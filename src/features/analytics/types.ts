export interface ActiveMemberCounts {
  dau: number;
  wau: number;
  mau: number;
}

export interface LoginTrend {
  date: string;
  count: number;
}

export interface RoleDistribution {
  roleName: string;
  count: number;
}

export interface TopFileType {
  contentType: string;
  count: number;
  bytes: number;
}

export interface StorageStats {
  totalBytes: number;
  fileCount: number;
  topFileTypes: TopFileType[];
}

export interface InviteStats {
  totalInvitesSent: number;
  acceptedInvites: number;
  acceptanceRatePercent: number;
}

export interface SecurityPosture {
  totalMembers: number;
  mfaEnabledMembers: number;
  mfaAdoptionPercent: number;
  staleAccountsCount: number;
  ssoEnabled: boolean;
}

export interface ActivityFeedItem {
  id: string;
  tenantId: string;
  actorId?: string | null;
  actorName?: string | null;
  actorAvatarUrl?: string | null;
  verb: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AnalyticsOverview {
  range: "7d" | "30d" | "90d";
  activeMembers: ActiveMemberCounts;
  loginsByDay: LoginTrend[];
  roleDistribution: RoleDistribution[];
  storage: StorageStats;
  inviteConversion: InviteStats;
  securityPosture: SecurityPosture;
  recentActivity: ActivityFeedItem[];
  generatedAt: string;
}

export interface UsageDailyItem {
  id: string;
  tenantId: string;
  meter: string;
  date: string;
  quantity: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export type ReportType = "MEMBERS" | "AUDIT" | "USAGE" | "FILES" | "BILLING" | "SECURITY";
export type ReportFormat = "CSV" | "JSON";
export type ReportRunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface ReportDefinition {
  id: string;
  tenantId: string;
  name: string;
  type: ReportType;
  filters?: Record<string, unknown>;
  columns?: string[];
  format: ReportFormat;
  scheduleCron?: string | null;
  recipients?: string[];
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportRun {
  id: string;
  definitionId: string;
  tenantId: string;
  status: ReportRunStatus;
  rowCount: number;
  s3Key?: string | null;
  downloadUrl?: string | null;
  error?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
}

export interface CreateReportDefinitionInput {
  name: string;
  type: ReportType;
  filters?: Record<string, unknown>;
  columns?: string[];
  format?: ReportFormat;
  scheduleCron?: string;
  recipients?: string[];
}

export interface PlatformMetrics {
  kpis: {
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    planDistribution: Array<{ plan: string; count: number }>;
    totalUsers: number;
    totalStorageBytes: number;
  };
  dailyTrends: Array<{
    id: string;
    date: string;
    mrrCents: number;
    arrCents: number;
    activeTenants: number;
    newTenants: number;
    churnedTenants: number;
    totalStorageBytes: number;
    apiRequestsCount: number;
  }>;
  updatedAt: string;
}
