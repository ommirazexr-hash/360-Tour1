export interface Lead {
  id: string;
  projectId: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source: string | null;
  createdAt: string;
}

export interface LeadWithProject extends Lead {
  projectName: string;
  projectSlug: string;
}

export interface CreateLeadRequest {
  projectId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
}

export interface LeadFilterQuery {
  projectId?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}
