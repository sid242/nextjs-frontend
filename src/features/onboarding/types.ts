export type OnboardingStepKey =
  | "verify_email"
  | "setup_branding"
  | "invite_members"
  | "create_role"
  | "upload_file"
  | "configure_smtp"
  | "enable_2fa"
  | "configure_sso";

export interface OnboardingStepItem {
  key: OnboardingStepKey;
  title: string;
  description: string;
  href: string;
  status: "PENDING" | "COMPLETED" | "SKIPPED";
  completedAt?: string | null;
  autoDetected?: boolean;
}

export interface OnboardingOverview {
  steps: OnboardingStepItem[];
  totalCount: number;
  completedCount: number;
  skippedCount: number;
  progressPercent: number;
  isComplete: boolean;
  isDismissed: boolean;
}

export interface UpdateStepProgressInput {
  status: "COMPLETED" | "SKIPPED";
  data?: Record<string, unknown>;
}
