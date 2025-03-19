import { Lead as ApiLead, LeadStatus, LeadSource } from '../types/lead';

// Dashboard Lead type (matches the current implementation in dashboard/leads/page.tsx)
export type DashboardLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  source: string;
  created_at: string;
  last_contact: string | null;
  notes: string;
  score?: number;
  conversion_probability?: number;
  address?: string;
  campaign_id?: string;
  campaign_name?: string;
  company_name: string;
  position: string;
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  isInLowConversionPipeline?: boolean;
  timeline?: Array<{
    id: number | string;
    type: string;
    content: string;
    created_at: string;
    user?: {
      id: string;
      name: string;
    };
  }>;
};

/**
 * Convert API Lead to Dashboard Lead format
 */
export function apiToDashboardLead(apiLead: ApiLead): DashboardLead {
  return {
    id: apiLead.id.toString(),
    name: `${apiLead.first_name} ${apiLead.last_name}`,
    email: apiLead.email || '',
    phone: apiLead.phone || '',
    status: mapApiStatusToDashboard(apiLead.status),
    source: apiLead.source,
    created_at: apiLead.created_at,
    last_contact: apiLead.custom_fields?.last_contact || null,
    notes: apiLead.custom_fields?.notes || '',
    score: apiLead.lead_score,
    conversion_probability: apiLead.conversion_probability,
    address: apiLead.custom_fields?.address || '',
    campaign_id: apiLead.custom_fields?.campaign_id?.toString() || undefined,
    campaign_name: apiLead.custom_fields?.campaign_name || '',
    company_name: apiLead.company_name || apiLead.company || '',
    position: apiLead.job_title || apiLead.title || '',
    linkedin_url: apiLead.linkedin_url,
    facebook_url: apiLead.facebook_url,
    twitter_url: apiLead.twitter_url,
    timeline: apiLead.custom_fields?.timeline || [],
    isInLowConversionPipeline: false // Default value, will be overridden later
  };
}

/**
 * Convert Dashboard Lead to API Lead format
 */
export function dashboardToApiLead(dashboardLead: DashboardLead): Partial<ApiLead> {
  return {
    id: parseInt(dashboardLead.id, 10),
    first_name: dashboardLead.name.split(' ')[0],
    last_name: dashboardLead.name.split(' ').slice(1).join(' '),
    email: dashboardLead.email || undefined,
    phone: dashboardLead.phone || undefined,
    company_name: dashboardLead.company_name,
    job_title: dashboardLead.position,
    status: mapDashboardStatusToApi(dashboardLead.status),
    source: mapDashboardSourceToApi(dashboardLead.source),
    lead_score: dashboardLead.score || 0,
    conversion_probability: dashboardLead.conversion_probability,
    custom_fields: {
      notes: dashboardLead.notes,
      address: dashboardLead.address,
      campaign_id: dashboardLead.campaign_id,
      campaign_name: dashboardLead.campaign_name,
      last_contact: dashboardLead.last_contact,
      timeline: dashboardLead.timeline
    },
    linkedin_url: dashboardLead.linkedin_url,
    facebook_url: dashboardLead.facebook_url,
    twitter_url: dashboardLead.twitter_url
    // isInLowConversionPipeline is not sent back to the API as it's derived from campaign membership
  };
}

/**
 * Map API Lead status to Dashboard status
 */
function mapApiStatusToDashboard(status: LeadStatus): DashboardLead['status'] {
  switch (status) {
    case LeadStatus.NEW:
      return 'new';
    case LeadStatus.CONTACTED:
      return 'contacted';
    case LeadStatus.QUALIFIED:
      return 'qualified';
    case LeadStatus.PROPOSAL:
      return 'proposal';
    case LeadStatus.NEGOTIATION:
      return 'negotiation';
    case LeadStatus.WON:
      return 'closed_won';
    case LeadStatus.LOST:
      return 'closed_lost';
    default:
      return 'new';
  }
}

/**
 * Map Dashboard status to API Lead status
 */
function mapDashboardStatusToApi(status: DashboardLead['status']): LeadStatus {
  switch (status) {
    case 'new':
      return LeadStatus.NEW;
    case 'contacted':
      return LeadStatus.CONTACTED;
    case 'qualified':
      return LeadStatus.QUALIFIED;
    case 'proposal':
      return LeadStatus.PROPOSAL;
    case 'negotiation':
      return LeadStatus.NEGOTIATION;
    case 'closed_won':
      return LeadStatus.WON;
    case 'closed_lost':
      return LeadStatus.LOST;
    default:
      return LeadStatus.NEW;
  }
}

/**
 * Map Dashboard source to API Lead source
 */
function mapDashboardSourceToApi(source: string): LeadSource {
  switch (source.toLowerCase()) {
    case 'website':
      return LeadSource.WEBSITE;
    case 'referral':
      return LeadSource.REFERRAL;
    case 'linkedin':
      return LeadSource.LINKEDIN;
    case 'cold call':
      return LeadSource.COLD_CALL;
    case 'email campaign':
      return LeadSource.EMAIL_CAMPAIGN;
    case 'event':
      return LeadSource.EVENT;
    default:
      return LeadSource.OTHER;
  }
} 