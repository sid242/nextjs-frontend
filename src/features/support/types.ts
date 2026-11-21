export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketStatus = "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
export type TicketCategory = "GENERAL" | "BILLING" | "TECHNICAL" | "SECURITY";

export interface SupportTicket {
  id: string;
  tenantId: string;
  userId: string;
  ticketRef: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: TicketCategory;
  assigneeStaffId?: string | null;
  metadata?: Record<string, unknown>;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketMessage {
  id: string;
  ticketId: string;
  tenantId: string;
  senderType: "USER" | "STAFF" | "SYSTEM";
  senderId: string;
  senderName?: string | null;
  message: string;
  attachments?: Record<string, unknown>[];
  isInternal: boolean;
  createdAt: string;
}

export interface TicketDetailsResponse {
  ticket: SupportTicket;
  messages: SupportTicketMessage[];
}

export interface CreateTicketInput {
  subject: string;
  description: string;
  priority?: TicketPriority;
  category?: TicketCategory;
  metadata?: Record<string, unknown>;
}

export interface AddTicketMessageInput {
  message: string;
  attachments?: Record<string, unknown>[];
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeStaffId?: string | null;
}

export interface CreateFeedbackInput {
  rating: number;
  category: "GENERAL" | "BUG" | "FEATURE" | "UI";
  comment: string;
  metadata?: Record<string, unknown>;
}

export interface FeedbackItem {
  id: string;
  tenantId?: string | null;
  userId?: string | null;
  rating: number;
  category: string;
  comment: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
