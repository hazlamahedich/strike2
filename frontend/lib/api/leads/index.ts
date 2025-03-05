import apiClient from '../client';
import { 
  Lead, 
  LeadDetail, 
  LeadCreate, 
  LeadUpdate, 
  LeadFilter, 
  LeadImport, 
  LeadExport,
  CampaignLead,
  LeadCampaignStatus
} from '../../types/lead';

// Base URL for lead endpoints
const BASE_URL = 'leads';

// Get leads with optional filtering
export const getLeads = async (
  skip: number = 0,
  limit: number = 100,
  status?: string,
  source?: string,
  owner_id?: number,
  campaign_id?: number,
  search?: string,
  sort_by: string = 'created_at',
  sort_desc: boolean = true
): Promise<Lead[]> => {
  const queryParams = new URLSearchParams();
  queryParams.append('skip', skip.toString());
  queryParams.append('limit', limit.toString());
  queryParams.append('sort_by', sort_by);
  queryParams.append('sort_desc', sort_desc.toString());
  
  if (status) queryParams.append('status', status);
  if (source) queryParams.append('source', source);
  if (owner_id) queryParams.append('owner_id', owner_id.toString());
  if (campaign_id) queryParams.append('campaign_id', campaign_id.toString());
  if (search) queryParams.append('search', search);
  
  return apiClient.get<Lead[]>(`${BASE_URL}?${queryParams.toString()}`);
};

// Get a single lead by ID
export const getLead = async (
  leadId: number,
  includeCampaignData: boolean = true
): Promise<LeadDetail> => {
  const queryParams = new URLSearchParams();
  queryParams.append('include_campaign_data', includeCampaignData.toString());
  
  return apiClient.get<LeadDetail>(`${BASE_URL}/${leadId}?${queryParams.toString()}`);
};

// Create a new lead
export const createLead = async (leadData: LeadCreate): Promise<Lead> => {
  return apiClient.post<Lead>(BASE_URL, leadData);
};

// Update an existing lead
export const updateLead = async (leadId: number, leadData: LeadUpdate): Promise<Lead> => {
  return apiClient.put<Lead>(`${BASE_URL}/${leadId}`, leadData);
};

// Delete a lead
export const deleteLead = async (leadId: number): Promise<void> => {
  return apiClient.delete<void>(`${BASE_URL}/${leadId}`);
};

// Import leads from a file
export const importLeads = async (
  file: File,
  fieldMapping: Record<string, string>,
  campaignId?: number,
  handleDuplicates: string = 'skip'
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('field_mapping', JSON.stringify(fieldMapping));
  formData.append('handle_duplicates', handleDuplicates);
  
  if (campaignId) {
    formData.append('campaign_id', campaignId.toString());
  }
  
  // Custom fetch to handle FormData
  const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/${BASE_URL}/import`;
  const token = apiClient.getAuthToken();
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || errorData.message || 'Failed to import leads');
  }
  
  return response.json();
};

// Export leads
export const exportLeads = async (exportConfig: LeadExport): Promise<any> => {
  return apiClient.post<any>(`${BASE_URL}/export`, exportConfig);
};

// Get lead timeline
export const getLeadTimeline = async (leadId: number, limit: number = 20): Promise<any[]> => {
  return apiClient.get<any[]>(`${BASE_URL}/${leadId}/timeline?limit=${limit}`);
};

// Get lead campaigns
export const getLeadCampaigns = async (leadId: number, includeRemoved: boolean = false): Promise<any[]> => {
  return apiClient.get<any[]>(`${BASE_URL}/${leadId}/campaigns?include_removed=${includeRemoved}`);
};

// Add lead to campaign
export const addLeadToCampaign = async (
  leadId: number,
  campaignId: number,
  status: LeadCampaignStatus = LeadCampaignStatus.ADDED,
  notes?: string,
  metadata?: Record<string, any>
): Promise<CampaignLead> => {
  const queryParams = new URLSearchParams();
  queryParams.append('status', status);
  if (notes) queryParams.append('notes', notes);
  
  return apiClient.post<CampaignLead>(
    `${BASE_URL}/${leadId}/campaigns/${campaignId}?${queryParams.toString()}`,
    { metadata }
  );
};

// Remove lead from campaign
export const removeLeadFromCampaign = async (
  leadId: number,
  campaignId: number,
  notes?: string
): Promise<void> => {
  const queryParams = new URLSearchParams();
  if (notes) queryParams.append('notes', notes);
  
  return apiClient.delete<void>(
    `${BASE_URL}/${leadId}/campaigns/${campaignId}?${queryParams.toString()}`
  );
};

// Update lead campaign status
export const updateLeadCampaignStatus = async (
  leadId: number,
  campaignId: number,
  status: LeadCampaignStatus,
  notes?: string,
  metadata?: Record<string, any>
): Promise<CampaignLead> => {
  return apiClient.put<CampaignLead>(
    `${BASE_URL}/${leadId}/campaigns/${campaignId}`,
    { status, notes, metadata }
  );
};

// Bulk add leads to campaign
export const bulkAddLeadsToCampaign = async (
  campaignId: number,
  leadIds: number[],
  status: LeadCampaignStatus = LeadCampaignStatus.ADDED,
  notes?: string
): Promise<any> => {
  return apiClient.post<any>(
    `${BASE_URL}/bulk-add-to-campaign`,
    { campaign_id: campaignId, lead_ids: leadIds, status, notes }
  );
};

// Get lead insights
export const getLeadInsights = async (leadId: number): Promise<any> => {
  return apiClient.get<any>(`${BASE_URL}/${leadId}/insights`);
}; 