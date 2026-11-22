export interface OrgChartNode {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  department: string | null;
  jobTitle: string | null;
  managerMemberId: string | null;
  status: string;
  directReportsCount: number;
  directReports: OrgChartNode[];
}

export interface OrgChartResponse {
  roots: OrgChartNode[];
  totalMembers: number;
  departments: string[];
}

export interface ImportMemberRow {
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
  phone?: string;
  managerEmail?: string | null;
}

export interface ValidationRowItem {
  row: number;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
  phone?: string;
  managerEmail?: string | null;
  status: "VALID" | "ERROR" | "DUPLICATE";
  error?: string;
}

export interface ValidateImportResult {
  valid: boolean;
  quotaAvailable: number;
  totalRows: number;
  validCount: number;
  errorCount: number;
  exceedsQuota: boolean;
  rows: ValidationRowItem[];
}

export interface MemberImportJob {
  id: string;
  state: "waiting" | "active" | "completed" | "failed";
  progress: number;
  result?: ExecuteImportResult;
}

export interface ExecuteImportResult {
  totalSubmitted: number;
  importedCount: number;
  failedCount: number;
  results: Array<{ email: string; status: "IMPORTED" | "FAILED"; error?: string }>;
}
