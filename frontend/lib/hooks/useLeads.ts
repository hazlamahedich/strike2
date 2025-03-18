import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as leadApi from '../api/leads';
import { 
  Lead, 
  LeadDetail, 
  LeadCreate, 
  LeadUpdate, 
  LeadExport,
  LeadCampaignStatus
} from '../types/lead';
import { validateCampaignAction } from '../utils/campaignUtils';

// Query keys
export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (filters: any) => [...leadKeys.lists(), filters] as const,
  details: () => [...leadKeys.all, 'detail'] as const,
  detail: (id: number) => [...leadKeys.details(), id] as const,
  campaigns: (id: number) => [...leadKeys.detail(id), 'campaigns'] as const,
  timeline: (id: number, interactionTypes?: string[]) => [...leadKeys.detail(id), 'timeline', ...(interactionTypes || [])] as const,
  insights: (id: number) => [...leadKeys.detail(id), 'insights'] as const,
};

// Get leads with filtering
export const useLeads = (
  skip: number = 0,
  limit: number = 100,
  status?: string,
  source?: string,
  owner_id?: number,
  campaign_id?: number,
  search?: string,
  sort_by: string = 'created_at',
  sort_desc: boolean = true
) => {
  const filters = { skip, limit, status, source, owner_id, campaign_id, search, sort_by, sort_desc };
  
  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: () => leadApi.getLeads(
      skip, 
      limit, 
      status, 
      source, 
      owner_id, 
      campaign_id, 
      search, 
      sort_by, 
      sort_desc
    ),
    placeholderData: (previousData) => previousData,
  });
};

// Get a single lead
export const useLead = (leadId: number, includeDetails: boolean = false) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: leadKeys.detail(leadId),
    queryFn: async () => {
      console.log('⭐⭐⭐ useLead - Making API call for leadId:', leadId, 'as type:', typeof leadId);
      
      // Skip API call if leadId is -1 (used for mock data)
      if (leadId === -1) {
        console.log('⭐⭐⭐ useLead - Mock data mode, skipping API call');
        return null;
      }
      
      // Validate leadId
      if (isNaN(leadId) || leadId <= 0) {
        console.error(`Invalid lead ID in useLead hook: ${leadId}`);
        throw new Error(`Invalid lead ID: ${leadId}`);
      }
      
      try {
        // Convert leadId to string to match the API function signature
        return await leadApi.getLead(String(leadId));
      } catch (error: any) {
        console.error(`Error in useLead hook for leadId ${leadId}:`, error);
        throw error; // Re-throw to be caught by React Query
      }
    },
    enabled: leadId !== -1, // Only run the query if leadId is not -1
    retry: 1, // Only retry once to avoid excessive retries on permanent errors
  });
};

// Create a new lead
export const useCreateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (leadData: LeadCreate) => leadApi.createLead(leadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
};

// Update a lead
export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ leadId, leadData }: { leadId: number; leadData: LeadUpdate }) => 
      leadApi.updateLead(leadId, leadData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(variables.leadId) });
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
};

// Delete a lead
export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (leadId: number) => leadApi.deleteLead(String(leadId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
};

// Import leads
export const useImportLeads = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      file, 
      fieldMapping, 
      campaignId, 
      handleDuplicates 
    }: { 
      file: File; 
      fieldMapping: Record<string, string>; 
      campaignId?: number; 
      handleDuplicates?: string;
    }) => leadApi.importLeads(file, fieldMapping, campaignId, handleDuplicates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
};

// Export leads
export const useExportLeads = () => {
  return useMutation({
    mutationFn: (exportConfig: LeadExport) => leadApi.exportLeads(exportConfig),
  });
};

// Get lead timeline
export const useLeadTimeline = (leadId: number, limit: number = 20, interactionTypes?: string[]) => {
  return useQuery({
    queryKey: leadKeys.timeline(leadId, interactionTypes),
    queryFn: () => {
      console.log('⭐⭐⭐ useLeadTimeline - Making API call for leadId:', leadId, 'as type:', typeof leadId);
      if (leadId === -1) {
        console.log('⭐⭐⭐ useLeadTimeline - Mock data mode, skipping API call');
        return null;
      }
      
      // Convert leadId to string to match the API function signature
      return leadApi.getLeadTimeline(String(leadId));
    },
    enabled: leadId !== -1, // Only run the query if leadId is not -1
  });
};

// Get lead campaigns
export const useLeadCampaigns = (leadId: number, includeRemoved: boolean = false) => {
  return useQuery({
    queryKey: leadKeys.campaigns(leadId),
    queryFn: () => leadApi.getLeadCampaigns(leadId, includeRemoved),
    enabled: !!leadId,
  });
};

// Add lead to campaign
export const useAddLeadToCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      leadId, 
      campaignId, 
      status, 
      notes, 
      metadata,
      campaignStatus
    }: { 
      leadId: number; 
      campaignId: number; 
      status?: LeadCampaignStatus; 
      notes?: string; 
      metadata?: Record<string, any>;
      campaignStatus: string;
    }) => {
      // Validate campaign status before proceeding
      if (!validateCampaignAction(campaignStatus as any, 'lead')) {
        throw new Error(`Cannot add leads to a ${campaignStatus} campaign`);
      }
      
      return leadApi.addLeadToCampaign(String(campaignId), String(leadId));
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.campaigns(variables.leadId) });
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(variables.leadId) });
    },
  });
};

// Remove lead from campaign
export const useRemoveLeadFromCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      leadId, 
      campaignId, 
      notes,
      campaignStatus
    }: { 
      leadId: number; 
      campaignId: number; 
      notes?: string;
      campaignStatus: string;
    }) => {
      // Validate campaign status before proceeding
      if (!validateCampaignAction(campaignStatus as any, 'lead')) {
        throw new Error(`Cannot remove leads from a ${campaignStatus} campaign`);
      }
      
      return leadApi.removeLeadFromCampaign(leadId, campaignId, notes);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.campaigns(variables.leadId) });
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(variables.leadId) });
    },
  });
};

// Update lead campaign status
export const useUpdateLeadCampaignStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      leadId, 
      campaignId, 
      status, 
      notes, 
      metadata,
      campaignStatus
    }: { 
      leadId: number; 
      campaignId: number; 
      status: LeadCampaignStatus; 
      notes?: string; 
      metadata?: Record<string, any>;
      campaignStatus: string;
    }) => {
      // Validate campaign status before proceeding
      if (!validateCampaignAction(campaignStatus as any, 'lead')) {
        throw new Error(`Cannot update leads in a ${campaignStatus} campaign`);
      }
      
      return leadApi.updateLeadCampaignStatus(leadId, campaignId, status, notes, metadata);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.campaigns(variables.leadId) });
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(variables.leadId) });
    },
  });
};

// Bulk add leads to campaign
export const useBulkAddLeadsToCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      campaignId, 
      leadIds, 
      status, 
      notes,
      campaignStatus
    }: { 
      campaignId: number; 
      leadIds: number[]; 
      status?: LeadCampaignStatus; 
      notes?: string;
      campaignStatus: string;
    }) => {
      // Validate campaign status before proceeding
      if (!validateCampaignAction(campaignStatus as any, 'lead')) {
        throw new Error(`Cannot add leads to a ${campaignStatus} campaign`);
      }
      
      return leadApi.bulkAddLeadsToCampaign(campaignId, leadIds, status, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
};

// Get lead insights
export const useLeadInsights = (leadId: number) => {
  return useQuery({
    queryKey: leadKeys.insights(leadId),
    queryFn: () => {
      console.log('⭐⭐⭐ useLeadInsights - Making API call for leadId:', leadId, 'as type:', typeof leadId);
      if (leadId === -1) {
        console.log('⭐⭐⭐ useLeadInsights - Mock data mode, skipping API call');
        return null;
      }
      
      // Convert leadId to string to match the API function signature
      const result = leadApi.getLeadInsights(String(leadId));
      return result;
    },
    enabled: leadId !== -1, // Only run the query if leadId is not -1
  });
};

// Add a note to a lead
export const useAddLeadNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      leadId, 
      content, 
      isPrivate = false 
    }: { 
      leadId: number; 
      content: string; 
      isPrivate?: boolean;
    }) => leadApi.addLeadNote(leadId, content, isPrivate),
    onSuccess: (data, variables) => {
      // Invalidate lead detail and timeline queries to refresh the data
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(variables.leadId) });
      queryClient.invalidateQueries({ queryKey: leadKeys.timeline(variables.leadId) });
    },
  });
}; 