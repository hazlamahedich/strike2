import { get, post, put, del } from './apiClient';
import { Lead, LeadCreate, LeadUpdate } from '@/types/lead';

const API_ENDPOINT = '/api/v1/leads';

// Helper function to map database lead to frontend Lead type
const mapDatabaseLeadToFrontend = (dbLead: any): Lead => {
  return {
    id: dbLead.id.toString(),
    first_name: dbLead.first_name,
    last_name: dbLead.last_name,
    email: dbLead.email,
    phone: dbLead.phone,
    company: dbLead.company,
    title: dbLead.title,
    status: dbLead.status,
    source: dbLead.source,
    created_at: dbLead.created_at,
    updated_at: dbLead.updated_at,
    owner_id: dbLead.owner_id?.toString(),
    custom_fields: dbLead.custom_fields,
    lead_score: dbLead.lead_score,
    linkedin_url: dbLead.linkedin_url,
    facebook_url: dbLead.facebook_url,
    twitter_url: dbLead.twitter_url
  };
};

// Get all leads
export const getLeads = async () => {
  const response = await get<any[]>(API_ENDPOINT);
  
  if (response.data) {
    // Map each lead to the frontend Lead type
    const mappedLeads = response.data.map(mapDatabaseLeadToFrontend);
    return { data: mappedLeads, error: null };
  }
  
  return response;
};

// Get a specific lead by ID
export const getLead = async (id: string) => {
  const response = await get<any>(`${API_ENDPOINT}/${id}`);
  
  if (response.data) {
    // Map the lead to the frontend Lead type
    const mappedLead = mapDatabaseLeadToFrontend(response.data);
    return { data: mappedLead, error: null };
  }
  
  return response;
};

// Create a new lead
export const createLead = async (leadData: LeadCreate) => {
  const response = await post<any>(API_ENDPOINT, leadData);
  
  if (response.data) {
    // Map the created lead to the frontend Lead type
    const mappedLead = mapDatabaseLeadToFrontend(response.data);
    return { data: mappedLead, error: null };
  }
  
  return response;
};

// Update an existing lead
export const updateLead = async (id: string, updateData: LeadUpdate) => {
  const response = await put<any>(`${API_ENDPOINT}/${id}`, updateData);
  
  if (response.data) {
    // Map the updated lead to the frontend Lead type
    const mappedLead = mapDatabaseLeadToFrontend(response.data);
    return { data: mappedLead, error: null };
  }
  
  return response;
};

// Delete a lead
export const deleteLead = async (id: string) => {
  return del<void>(`${API_ENDPOINT}/${id}`);
};

// Add lead to campaign
export const addLeadToCampaign = async (leadId: string, campaignId: string) => {
  return post<any>(`${API_ENDPOINT}/${leadId}/campaigns/${campaignId}`, {});
};

// Remove lead from campaign
export const removeLeadFromCampaign = async (leadId: string, campaignId: string) => {
  return del<void>(`${API_ENDPOINT}/${leadId}/campaigns/${campaignId}`);
};

// Update lead campaign status
export const updateLeadCampaignStatus = async (leadId: string, campaignId: string, status: string) => {
  return put<any>(`${API_ENDPOINT}/${leadId}/campaigns/${campaignId}`, { status });
};

// Bulk add leads to campaign
export const bulkAddLeadsToCampaign = async (leadIds: string[], campaignId: string) => {
  return post<any>(`${API_ENDPOINT}/bulk/campaigns/${campaignId}`, { lead_ids: leadIds });
};

// Get lead insights
export const getLeadInsights = async (leadId: string) => {
  return get<any>(`${API_ENDPOINT}/${leadId}/insights`);
};

// Add lead note
export const addLeadNote = async (leadId: string, note: string) => {
  return post<any>(`${API_ENDPOINT}/${leadId}/notes`, { content: note });
};

// Import leads
export const importLeads = async (fileData: FormData) => {
  return post<any>(`${API_ENDPOINT}/import`, fileData);
};

// Export leads
export const exportLeads = async (filters?: any) => {
  return get<any>(`${API_ENDPOINT}/export`, filters);
};

// Get lead timeline
export const getLeadTimeline = async (leadId: string) => {
  return get<any>(`${API_ENDPOINT}/${leadId}/timeline`);
};

// Get lead campaigns
export const getLeadCampaigns = async (leadId: string) => {
  return get<any>(`${API_ENDPOINT}/${leadId}/campaigns`);
}; 