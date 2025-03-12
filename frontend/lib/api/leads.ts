import { apiClient } from './apiClient';
import { get, post, put, del } from './apiClient';
import { ApiResponse, ApiError } from './apiClient';
import { Lead, LeadCreate, LeadUpdate } from '@/types/lead';
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';
import axios from 'axios';

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
export const getLeads = async (): Promise<ApiResponse<Lead[]>> => {
  try {
    // Check if we're in development mode and should use mock data
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || 
        (typeof window !== 'undefined' && getMockDataStatus())) {
      console.log('Using mock data for leads (client-side)');
      
      // Return mock data
      const mockLeads = [
        {
          id: "1",
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          phone: "+1234567890",
          company: "Acme Inc",
          job_title: "CEO",
          status: "NEW",
          source: "WEBSITE",
          notes: "Interested in our enterprise plan",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString(),
          lead_score: 85,
          owner_id: "1"
        },
        {
          id: "2",
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
          phone: "+1987654321",
          company: "XYZ Corp",
          job_title: "CTO",
          status: "CONTACTED",
          source: "REFERRAL",
          notes: "Looking for custom solutions",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date().toISOString(),
          lead_score: 70,
          owner_id: "2"
        }
      ];
      
      // Map each lead to the frontend Lead type
      const mappedLeads = mockLeads.map(mapDatabaseLeadToFrontend);
      return {
        data: mappedLeads,
        error: null
      };
    }
    
    const response = await get<any[]>(API_ENDPOINT);
    
    if (response.data) {
      // Map each lead to the frontend Lead type
      const mappedLeads = response.data.map(mapDatabaseLeadToFrontend);
      return { data: mappedLeads, error: null };
    }
    
    return response;
  } catch (error) {
    console.error('Error in getLeads:', error);
    
    // Check if it's an authentication error
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return {
        data: null as unknown as Lead[],
        error: {
          message: 'Authentication required. Please log in again.',
          code: 'AUTH_REQUIRED',
          status: 401,
          details: { isAuthError: true }
        } as ApiError
      };
    }
    
    // Return mock data on error in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Returning mock data due to API error');
      
      const mockLeads = [
        {
          id: "1",
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          phone: "+1234567890",
          company: "Acme Inc",
          job_title: "CEO",
          status: "NEW",
          source: "WEBSITE",
          notes: "Interested in our enterprise plan",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString(),
          lead_score: 85,
          owner_id: "1"
        },
        {
          id: "2",
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
          phone: "+1987654321",
          company: "XYZ Corp",
          job_title: "CTO",
          status: "CONTACTED",
          source: "REFERRAL",
          notes: "Looking for custom solutions",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date().toISOString(),
          lead_score: 70,
          owner_id: "2"
        }
      ];
      
      // Map each lead to the frontend Lead type
      const mappedLeads = mockLeads.map(mapDatabaseLeadToFrontend);
      return { data: mappedLeads, error: null };
    }
    
    // Return the error for production
    return {
      data: null as unknown as Lead[],
      error: error instanceof Error ? error : new Error('Unknown error in getLeads')
    };
  }
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