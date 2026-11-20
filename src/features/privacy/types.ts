export interface DataExportRequest {
  id: string;
  scope: "USER" | "TENANT";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  downloadUrl?: string | null;
  fileSizeBytes?: number | null;
  errorMessage?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface AccountDeletionStatus {
  id: string;
  status: "COOLING_PERIOD" | "ANONYMIZED" | "CANCELED";
  requestedAt: string;
  graceEndsAt: string;
  reason?: string | null;
  coolingPeriodDays?: number;
  cancellationSecret?: string;
  alreadyPending?: boolean;
}

export interface TenantClosureStatus {
  isClosed: boolean;
  closedAt?: string | null;
  purgeScheduledAt?: string | null;
  status: string;
}

export interface ConsentDocumentStatus {
  documentId: string;
  type: "TERMS" | "PRIVACY" | "MARKETING" | "COOKIES";
  version: string;
  title: string;
  url: string;
  effectiveAt: string;
  acceptedVersion: string | null;
  isAccepted: boolean;
  requiresAcceptance: boolean;
}

export interface ConsentStatusResponse {
  documents: ConsentDocumentStatus[];
  requiresAnyAcceptance: boolean;
}
