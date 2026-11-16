export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";

export interface Lead {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: LeadStatus;
  value: number; // in cents / minor currency units
  departmentId: string | null;
  regionId: string | null;
  assignedMemberId: string | null;
  isConfidential: boolean;
  notes: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status?: LeadStatus;
  value?: number;
  departmentId?: string;
  regionId?: string;
  assignedMemberId?: string;
  isConfidential?: boolean;
  notes?: string;
}

export interface UpdateLeadInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: LeadStatus;
  value?: number;
  departmentId?: string;
  regionId?: string;
  assignedMemberId?: string | null;
  isConfidential?: boolean;
  notes?: string;
}

export interface ListLeadsFilter {
  status?: LeadStatus;
  departmentId?: string;
  regionId?: string;
  assignedMemberId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
