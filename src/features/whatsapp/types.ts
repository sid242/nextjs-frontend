export interface WhatsAppAccount {
  id: string;
  tenantId: string;
  wabaId: string;
  businessId?: string | null;
  displayName: string;
  connectionStatus:
    | "NOT_CONNECTED"
    | "ONBOARDING"
    | "PENDING_VERIFICATION"
    | "CONNECTED"
    | "RESTRICTED"
    | "DISCONNECTED"
    | "ERROR";
  connectedAt?: string | null;
  disconnectedAt?: string | null;
  createdAt: string;
}

export interface WhatsAppPhoneNumber {
  id: string;
  tenantId: string;
  businessAccountId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName?: string | null;
  qualityRating?: string | null;
  messagingLimit?: string | null;
  isDefault: boolean;
  isEnabled: boolean;
  registrationStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateComponentParameter {
  type: "text" | "currency" | "date_time" | "image" | "document" | "video";
  text?: string;
  image?: { link?: string; id?: string };
  document?: { link?: string; id?: string; filename?: string };
  video?: { link?: string; id?: string };
}

export interface TemplateComponentInput {
  type: "header" | "body" | "button";
  sub_type?: "quick_reply" | "url";
  index?: number;
  parameters: TemplateComponentParameter[];
}

export interface WhatsAppTemplate {
  id: string;
  tenantId: string;
  businessAccountId: string;
  metaTemplateId?: string | null;
  name: string;
  category: "AUTHENTICATION" | "UTILITY" | "MARKETING";
  language: string;
  components: Array<{
    type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
    format?: "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO" | "LOCATION";
    text?: string;
    buttons?: Array<{
      type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "OTP";
      text: string;
      url?: string;
      phone_number?: string;
    }>;
  }>;
  status:
    "DRAFT" | "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "PAUSED" | "DISABLED" | "DELETED";
  rejectionReason?: string | null;
  qualityRating?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppContact {
  id: string;
  tenantId: string;
  phoneNumber: string;
  waId?: string | null;
  displayName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppContactConsent {
  id: string;
  tenantId: string;
  contactId: string;
  purpose: "AUTHENTICATION" | "TRANSACTIONAL" | "MARKETING";
  status: "OPTED_IN" | "OPTED_OUT";
  consentSource: string;
  policyVersion?: string | null;
  consentedAt: string;
  revokedAt?: string | null;
  createdAt: string;
}

export interface WhatsAppConversation {
  id: string;
  tenantId: string;
  phoneNumberId: string;
  contactId: string;
  contactName?: string | null;
  contactPhone?: string | null;
  isWindowOpen?: boolean;
  assignedStaffId?: string | null;
  status: "OPEN" | "PENDING" | "CLOSED";
  lastInboundMessageAt?: string | null;
  customerServiceWindowExpiresAt?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppMessage {
  id: string;
  tenantId: string;
  phoneNumberId: string;
  contactId: string;
  conversationId?: string | null;
  direction: "INBOUND" | "OUTBOUND";
  messageType:
    "TEMPLATE" | "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO" | "AUDIO" | "LOCATION" | "INTERACTIVE";
  templateId?: string | null;
  providerMessageId?: string | null;
  body?: string | null;
  internalStatus: "QUEUED" | "ACCEPTED" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  errorCode?: string | null;
  errorMessage?: string | null;
  acceptedAt?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedAt?: string | null;
  createdAt: string;
}

export interface WhatsAppCampaign {
  id: string;
  tenantId: string;
  name: string;
  templateId: string;
  phoneNumberId: string;
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "COMPLETED" | "PAUSED" | "CANCELLED" | "FAILED";
  scheduledAt?: string | null;
  totalRecipients: number;
  acceptedCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  createdAt: string;
}

export interface WhatsAppUsageSummary {
  totalMessages: number;
  totalEstimatedCost: string;
  categoryBreakdown: Array<{ category: string; count: number }>;
}

export interface WhatsAppUsageRecord {
  id: string;
  tenantId: string;
  wabaId: string;
  phoneNumberId: string;
  recipientCountry: string;
  templateCategory: string;
  providerMessageId?: string | null;
  deliveryStatus: string;
  messageTimestamp: string;
  pricingRateCardVersion: string;
  estimatedCost: string;
  actualCost?: string | null;
  currency: string;
  createdAt: string;
}
