import apiClient from '../client';
import type { ApiResponse, ApiError } from '../client';

export interface EmailContent {
  subject: string;
  content: string;
}

export interface EmailPayload {
  to: string;
  from: string;
  subject: string;
  content: string;
  leadId: string;
  campaignId?: string;
  updateLeadStatus?: string;
}

export interface ScheduleEmailPayload extends EmailPayload {
  scheduledDate: string; // ISO date string
}

interface ScheduleResponse {
  scheduledId: string;
}

interface ScheduledEmailsResponse {
  scheduledEmails: any[];
}

// Type guard to check if response is an ApiResponse
function isApiResponse<T>(response: ApiResponse<T> | ApiError): response is ApiResponse<T> {
  return (response as ApiResponse<T>).data !== undefined;
}

/**
 * Send an email immediately using SendGrid
 */
export const sendEmail = async (payload: EmailPayload): Promise<{ success: boolean; message: string }> => {
  try {
    await apiClient.post('/api/email/send', payload);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: 'Failed to send email' };
  }
};

/**
 * Schedule an email to be sent at a later time
 */
export const scheduleEmail = async (payload: ScheduleEmailPayload): Promise<{ success: boolean; message: string; scheduledId?: string }> => {
  try {
    const response = await apiClient.post<ScheduleResponse>('/api/email/schedule', payload);
    
    if (!isApiResponse(response)) {
      throw new Error('Failed to schedule email');
    }
    
    return { 
      success: true, 
      message: 'Email scheduled successfully',
      scheduledId: response.data.scheduledId
    };
  } catch (error) {
    console.error('Error scheduling email:', error);
    return { success: false, message: 'Failed to schedule email' };
  }
};

/**
 * Get all scheduled emails
 */
export const getScheduledEmails = async (leadId?: string): Promise<any[]> => {
  try {
    const url = leadId 
      ? `/api/email/scheduled?leadId=${leadId}` 
      : '/api/email/scheduled';
    const response = await apiClient.get<ScheduledEmailsResponse>(url);
    
    if (!isApiResponse(response)) {
      return [];
    }
    
    return response.data.scheduledEmails || [];
  } catch (error) {
    console.error('Error fetching scheduled emails:', error);
    return [];
  }
};

/**
 * Cancel a scheduled email
 */
export const cancelScheduledEmail = async (scheduledId: string): Promise<{ success: boolean; message: string }> => {
  try {
    await apiClient.delete(`/api/email/scheduled/${scheduledId}`);
    return { success: true, message: 'Scheduled email cancelled' };
  } catch (error) {
    console.error('Error cancelling scheduled email:', error);
    return { success: false, message: 'Failed to cancel scheduled email' };
  }
}; 