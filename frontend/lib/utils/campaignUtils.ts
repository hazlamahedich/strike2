import { toast } from 'sonner';
import apiClient from '../api/client';

// Campaign status types
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'scheduled' | 'cancelled';

/**
 * Check if leads can be added or updated based on campaign status
 * @param status Campaign status
 * @returns Boolean indicating if leads can be added/updated
 */
export const canModifyLeads = (status: CampaignStatus): boolean => {
  // Leads can be added/updated if campaign is draft, active, scheduled, or paused
  return status !== 'completed' && status !== 'cancelled';
};

/**
 * Check if activities can be added or updated based on campaign status
 * @param status Campaign status
 * @returns Boolean indicating if activities can be added/updated
 */
export const canModifyActivities = (status: CampaignStatus): boolean => {
  // Activities can only be added/updated if campaign is draft, active, or scheduled
  return status !== 'completed' && status !== 'cancelled' && status !== 'paused';
};

/**
 * Show appropriate message based on campaign status when an action is restricted
 * @param status Campaign status
 * @param actionType Type of action being attempted ('lead' or 'activity')
 */
export const showCampaignStatusMessage = (status: CampaignStatus, actionType: 'lead' | 'activity'): void => {
  if (status === 'completed') {
    toast.error(`Cannot modify ${actionType}s for a completed campaign.`);
  } else if (status === 'paused' && actionType === 'activity') {
    toast.error(`Cannot modify ${actionType}s while the campaign is paused.`);
  } else if (status === 'cancelled') {
    toast.error(`Cannot modify ${actionType}s for a cancelled campaign.`);
  }
};

/**
 * Validate if an action can be performed based on campaign status
 * @param status Campaign status
 * @param actionType Type of action being attempted ('lead' or 'activity')
 * @returns Boolean indicating if the action is allowed
 */
export const validateCampaignAction = (status: CampaignStatus, actionType: 'lead' | 'activity'): boolean => {
  const isAllowed = actionType === 'lead' ? canModifyLeads(status) : canModifyActivities(status);
  
  if (!isAllowed) {
    showCampaignStatusMessage(status, actionType);
  }
  
  return isAllowed;
};

/**
 * Change campaign status
 * @param campaignId Campaign ID
 * @param newStatus New status to set
 * @returns Promise with the updated campaign
 */
export const changeCampaignStatus = async (campaignId: string, newStatus: CampaignStatus) => {
  try {
    const { data, error } = await apiClient.put('campaigns', {
      id: campaignId,
      status: newStatus
    });
    
    if (error) {
      toast.error(`Failed to update campaign status: ${error.message}`);
      throw error;
    }
    
    toast.success(`Campaign status updated to ${newStatus}`);
    return data;
  } catch (error: any) {
    console.error('Error changing campaign status:', error);
    throw error;
  }
}; 