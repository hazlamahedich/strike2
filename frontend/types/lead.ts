export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  status?: string;
  source?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  owner_id?: string;
  custom_fields?: Record<string, any>;
}

export interface LeadCreate {
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
}

export interface LeadUpdate {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  status?: string;
  source?: string;
  notes?: string;
  owner_id?: string;
  custom_fields?: Record<string, any>;
}

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
  campaign_id?: string;
} 