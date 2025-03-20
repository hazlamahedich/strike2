/**
 * Interface representing a lead in the CRM
 */
export interface Lead {
  id?: number;
  name?: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  notes?: string;
  assigned_to?: number | null;
  last_contact_date?: string | null;
  next_follow_up_date?: string | null;
  lead_score?: number | null;
  lead_score_updated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface for lead filters
 */
export interface LeadFilters {
  status?: string;
  source?: string;
  assigned_to?: number;
  score_min?: number;
  score_max?: number;
  search?: string;
}

/**
 * Interface for lead creation payload
 */
export type CreateLeadPayload = Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'lead_score' | 'lead_score_updated_at'>;

/**
 * Interface for lead update payload
 */
export type UpdateLeadPayload = Partial<CreateLeadPayload>; 