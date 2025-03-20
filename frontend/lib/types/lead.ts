// Lead status enum
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  ENGAGED = 'engaged',
  QUALIFIED = 'qualified',
  NEGOTIATION = 'negotiation',
  PROPOSAL = 'proposal',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
  STALLED = 'stalled'
}

// Lead source enum
export enum LeadSource {
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  COLD_CALL = 'COLD_CALL',
  EVENT = 'EVENT',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  EMAIL_CAMPAIGN = 'EMAIL_CAMPAIGN',
  OTHER = 'OTHER',
}

// Lead interface
export interface Lead {
  id: number | string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  status: string;
  conversion_probability?: number;
  lead_score?: number;
  workflow_name?: string;
  days_in_pipeline?: number;
  days_in_stage?: number;
  last_activity?: string;
  last_activity_date?: string;
  avatar_url?: string;
  campaign_id?: number | string;
  campaign_name?: string;
  current_stage?: string;
  company_name?: string;
  position?: string;
  timeline?: TimelineActivity[];
  isInLowConversionPipeline?: boolean;
}

export type TimelineActivity = {
  id: string | number;
  type: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
  };
  details?: any;
} 