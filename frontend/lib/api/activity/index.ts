import apiClient from '../client';
import type { ApiResponse, ApiError } from '../client';

// Activity types for the low conversion pipeline
export enum ActivityType {
  EMAIL_SENT = 'email_sent',
  EMAIL_SCHEDULED = 'email_scheduled',
  CONTENT_GENERATED = 'content_generated',
  WORKFLOW_RUN = 'workflow_run',
  AGENT_INTERVENTION = 'agent_intervention',
  LEAD_STAGE_CHANGED = 'lead_stage_changed',
  PIPELINE_ANALYZED = 'pipeline_analyzed',
  WORKFLOW_CHANGED = 'workflow_changed'
}

// Activity source to track if it was automated or manual
export enum ActivitySource {
  AUTOMATED = 'automated',
  USER = 'user'
}

export interface ActivityPayload {
  leadId?: number;
  activityType: ActivityType;
  source: ActivitySource;
  payload?: {
    subject?: string;
    template?: string;
    scheduledDate?: string;
    scheduledId?: string;
    previousStage?: string;
    newStage?: string;
    [key: string]: any;
  };
}

export interface Activity {
  id: number;
  type: ActivityType;
  source: ActivitySource;
  user_id?: number;
  lead_id: number;
  campaign_id?: number;
  details: Record<string, any>;
  created_at: string;
}

/**
 * Type guard to check if response is an ApiResponse
 */
function isApiResponse<T>(response: ApiResponse<T> | ApiError): response is ApiResponse<T> {
  return (response as ApiResponse<T>).data !== undefined;
}

/**
 * Log an activity in the low conversion pipeline
 */
export const logActivity = async (
  payload: ActivityPayload
): Promise<boolean> => {
  try {
    const response = await apiClient.post<Activity>('/api/activities', {
      type: payload.activityType,
      source: payload.source,
      lead_id: payload.leadId,
      details: payload.payload || {}
    });
    
    return isApiResponse(response);
  } catch (error) {
    console.error('Error logging activity:', error);
    return false;
  }
};

/**
 * Get activities for a specific lead
 */
export const getLeadActivities = async (
  leadId: number
): Promise<Activity[]> => {
  try {
    const response = await apiClient.get<Activity[]>(`/api/leads/${leadId}/activities`);
    if (!isApiResponse(response)) {
      console.error('Error fetching lead activities:', response.error);
      return [];
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching lead activities:', error);
    return [];
  }
};

/**
 * Get activities for a specific campaign
 */
export const getCampaignActivities = async (
  campaignId: number
): Promise<Activity[]> => {
  try {
    const response = await apiClient.get<Activity[]>(`/api/campaigns/${campaignId}/activities`);
    if (!isApiResponse(response)) {
      console.error('Error fetching campaign activities:', response.error);
      return [];
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching campaign activities:', error);
    return [];
  }
};

/**
 * Get all low conversion pipeline activities
 */
export const getLowConversionActivities = async (
  leadId?: number
): Promise<Activity[]> => {
  try {
    const endpoint = leadId 
      ? `/api/low-conversion/activities?leadId=${leadId}`
      : '/api/low-conversion/activities';
      
    const response = await apiClient.get<Activity[]>(endpoint);
    if (!isApiResponse(response)) {
      console.error('Error fetching low conversion activities:', response.error);
      return [];
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching low conversion activities:', error);
    return [];
  }
}; 