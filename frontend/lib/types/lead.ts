export enum LeadSource {
  WEBSITE = "website",
  REFERRAL = "referral",
  LINKEDIN = "linkedin",
  COLD_CALL = "cold_call",
  EMAIL_CAMPAIGN = "email_campaign",
  EVENT = "event",
  OTHER = "other"
}

export enum LeadStatus {
  NEW = "new",
  CONTACTED = "contacted",
  QUALIFIED = "qualified",
  PROPOSAL = "proposal",
  NEGOTIATION = "negotiation",
  WON = "won",
  LOST = "lost"
}

export enum LeadCampaignStatus {
  ADDED = "added",
  CONTACTED = "contacted",
  RESPONDED = "responded",
  QUALIFIED = "qualified",
  CONVERTED = "converted",
  REJECTED = "rejected",
  UNSUBSCRIBED = "unsubscribed"
}

// Base Lead interface with fields common to both API and Supabase
export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  // Support both field naming conventions
  company?: string;
  company_name?: string;
  title?: string;
  job_title?: string;
  source: LeadSource;
  status: LeadStatus;
  owner_id?: number;
  team_id?: number;
  custom_fields: Record<string, any>;
  lead_score: number;
  conversion_probability?: number;
  created_at: string;
  updated_at: string;
  full_name: string;
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
}

export interface LeadDetail extends Lead {
  tasks: any[];
  emails: any[];
  calls: any[];
  meetings: any[];
  notes: any[];
  activities: any[];
  owner?: any;
  timeline: any[];
  campaigns: any[];
}

export interface LeadCreate {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  // Support both field naming conventions
  company?: string;
  company_name?: string;
  title?: string;
  job_title?: string;
  source: LeadSource;
  status: LeadStatus;
  owner_id?: number;
  team_id?: number;
  custom_fields: Record<string, any>;
  campaign_ids?: number[];
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
}

export interface LeadUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  // Support both field naming conventions
  company?: string;
  company_name?: string;
  title?: string;
  job_title?: string;
  source?: LeadSource;
  status?: LeadStatus;
  owner_id?: number;
  team_id?: number;
  custom_fields?: Record<string, any>;
  lead_score?: number;
  conversion_probability?: number;
  add_to_campaigns?: number[];
  remove_from_campaigns?: number[];
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  status_change_notes?: string;
}

// Form values interface for the lead form
export interface LeadFormValues {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  status?: string;
  source?: string;
  notes?: string;
  owner_id?: string;
  custom_fields?: Record<string, any>;
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
}

export interface LeadFilter {
  search?: string;
  status?: LeadStatus[];
  source?: LeadSource[];
  owner_id?: number | number[];
  team_id?: number | number[];
  lead_score_min?: number;
  lead_score_max?: number;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
  custom_filters?: Record<string, any>;
  campaign_id?: number | number[];
}

export interface LeadImport {
  data: Record<string, any>[];
  field_mapping: Record<string, string>;
  handle_duplicates: string;
  campaign_ids?: number[];
}

export interface LeadExport {
  lead_ids?: number[];
  filters?: Record<string, any>;
  export_format: string;
  include_fields?: string[];
  include_campaign_data: boolean;
}

export interface CampaignLead {
  campaign_id: number;
  lead_id: number;
  status: LeadCampaignStatus;
  added_by: number;
  added_at: string;
  updated_at: string;
  notes?: string;
  metadata?: Record<string, any>;
} 