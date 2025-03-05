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

// Query keys
export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (filters: any) => [...leadKeys.lists(), filters] as const,
  details: () => [...leadKeys.all, 'detail'] as const,
  detail: (id: number) => [...leadKeys.details(), id] as const,
  campaigns: (id: number) => [...leadKeys.detail(id), 'campaigns'] as const,
  timeline: (id: number) => [...leadKeys.detail(id), 'timeline'] as const,
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
export const useLead = (leadId: number, includeCampaignData: boolean = true) => {
  return useQuery({
    queryKey: leadKeys.detail(leadId),
    queryFn: () => leadApi.getLead(leadId, includeCampaignData),
    enabled: !!leadId,
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
    mutationFn: (leadId: number) => leadApi.deleteLead(leadId),
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
export const useLeadTimeline = (leadId: number, limit: number = 20) => {
  return useQuery({
    queryKey: leadKeys.timeline(leadId),
    queryFn: () => leadApi.getLeadTimeline(leadId, limit),
    enabled: !!leadId,
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
    mutationFn: ({ 
      leadId, 
      campaignId, 
      status, 
      notes, 
      metadata 
    }: { 
      leadId: number; 
      campaignId: number; 
      status?: LeadCampaignStatus; 
      notes?: string; 
      metadata?: Record<string, any>;
    }) => leadApi.addLeadToCampaign(leadId, campaignId, status, notes, metadata),
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
    mutationFn: ({ 
      leadId, 
      campaignId, 
      notes 
    }: { 
      leadId: number; 
      campaignId: number; 
      notes?: string;
    }) => leadApi.removeLeadFromCampaign(leadId, campaignId, notes),
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
    mutationFn: ({ 
      leadId, 
      campaignId, 
      status, 
      notes, 
      metadata 
    }: { 
      leadId: number; 
      campaignId: number; 
      status: LeadCampaignStatus; 
      notes?: string; 
      metadata?: Record<string, any>;
    }) => leadApi.updateLeadCampaignStatus(leadId, campaignId, status, notes, metadata),
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
    mutationFn: ({ 
      campaignId, 
      leadIds, 
      status, 
      notes 
    }: { 
      campaignId: number; 
      leadIds: number[]; 
      status?: LeadCampaignStatus; 
      notes?: string;
    }) => leadApi.bulkAddLeadsToCampaign(campaignId, leadIds, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
};

// Get lead insights
export const useLeadInsights = (leadId: number) => {
  return useQuery({
    queryKey: leadKeys.insights(leadId),
    queryFn: () => leadApi.getLeadInsights(leadId),
    enabled: !!leadId,
  });
}; 