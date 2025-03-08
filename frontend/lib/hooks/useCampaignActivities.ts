import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { validateCampaignAction } from '../utils/campaignUtils';

// Query keys
export const campaignActivityKeys = {
  all: ['campaignActivities'] as const,
  lists: () => [...campaignActivityKeys.all, 'list'] as const,
  list: (campaignId: string | number) => [...campaignActivityKeys.lists(), campaignId] as const,
  details: () => [...campaignActivityKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...campaignActivityKeys.details(), id] as const,
};

// Types
export type CampaignActivity = {
  id: string;
  campaign_id: string;
  activity_type: 'email' | 'sms' | 'call' | 'meeting' | 'task' | 'note' | 'other';
  title: string;
  description?: string;
  status: 'pending' | 'completed' | 'cancelled';
  scheduled_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  metadata?: Record<string, any>;
};

export type CampaignActivityCreate = Omit<CampaignActivity, 'id' | 'created_at' | 'updated_at'>;
export type CampaignActivityUpdate = Partial<Omit<CampaignActivity, 'id' | 'campaign_id' | 'created_at' | 'updated_at' | 'created_by'>>;

// Get activities for a campaign
export const useCampaignActivities = (campaignId: string | number) => {
  return useQuery({
    queryKey: campaignActivityKeys.list(campaignId),
    queryFn: async () => {
      const { data, error } = await apiClient.get<CampaignActivity[]>(`campaign_activities`, {
        campaign_id: campaignId
      });
      
      if (error) {
        throw new Error(`Failed to fetch campaign activities: ${error.message}`);
      }
      
      return data || [];
    },
    enabled: !!campaignId,
  });
};

// Create a new campaign activity
export const useCreateCampaignActivity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      activity, 
      campaignStatus 
    }: { 
      activity: CampaignActivityCreate; 
      campaignStatus: string;
    }) => {
      // Validate campaign status before proceeding
      if (!validateCampaignAction(campaignStatus as any, 'activity')) {
        throw new Error(`Cannot add activities to a ${campaignStatus} campaign`);
      }
      
      const { data, error } = await apiClient.post<CampaignActivity>('campaign_activities', activity);
      
      if (error) {
        throw new Error(`Failed to create campaign activity: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ 
          queryKey: campaignActivityKeys.list(data.campaign_id) 
        });
      }
    },
  });
};

// Update a campaign activity
export const useUpdateCampaignActivity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      activityId, 
      activityData, 
      campaignStatus 
    }: { 
      activityId: string | number; 
      activityData: CampaignActivityUpdate; 
      campaignStatus: string;
    }) => {
      // Validate campaign status before proceeding
      if (!validateCampaignAction(campaignStatus as any, 'activity')) {
        throw new Error(`Cannot update activities in a ${campaignStatus} campaign`);
      }
      
      const { data, error } = await apiClient.put<CampaignActivity>('campaign_activities', {
        id: activityId,
        ...activityData
      });
      
      if (error) {
        throw new Error(`Failed to update campaign activity: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ 
          queryKey: campaignActivityKeys.list(data.campaign_id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: campaignActivityKeys.detail(data.id) 
        });
      }
    },
  });
};

// Delete a campaign activity
export const useDeleteCampaignActivity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      activityId, 
      campaignId, 
      campaignStatus 
    }: { 
      activityId: string | number; 
      campaignId: string | number;
      campaignStatus: string;
    }) => {
      // Validate campaign status before proceeding
      if (!validateCampaignAction(campaignStatus as any, 'activity')) {
        throw new Error(`Cannot delete activities in a ${campaignStatus} campaign`);
      }
      
      const { error } = await apiClient.delete<any>('campaign_activities', activityId);
      
      if (error) {
        throw new Error(`Failed to delete campaign activity: ${error.message}`);
      }
      
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: campaignActivityKeys.list(variables.campaignId) 
      });
    },
  });
}; 