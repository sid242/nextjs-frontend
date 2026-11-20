export type AnnouncementSeverity = "INFO" | "MAINTENANCE" | "INCIDENT" | "FEATURE";
export type AnnouncementAudience = "ALL" | "PLAN" | "TENANT" | "ROLE";
export type AnnouncementStatus = "DRAFT" | "SCHEDULED" | "LIVE" | "ENDED";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  severity: AnnouncementSeverity;
  audience: AnnouncementAudience;
  audienceFilter: string[] | null;
  startsAt: string;
  endsAt: string | null;
  dismissible: boolean;
  link: string | null;
  status: AnnouncementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  body: string;
  tags: string[] | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}
