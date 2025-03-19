import apiClient from '../client';
import type { ApiResponse, ApiError } from '../client';

// Analysis response type
interface AnalysisResponse {
  summary: string;
  key_metrics: string[];
  successful_patterns: string[];
  recommendations: string[];
  content_suggestions: string[];
  experimental_ideas: string[];
  next_steps: string[];
  analysis_date: string;
  campaign_id: number;
  data_period_days: number;
}

// Content generation response type
interface ContentResponse {
  subject: string;
  content: string;
  template_type: string;
  lead_id: number;
  success: boolean;
}

// Workflow run response type
interface WorkflowRunResponse {
  campaign_id: number;
  new_leads_identified: number;
  new_leads_added: number;
  leads_rescored: number;
  leads_upgraded: number;
  leads_remained: number;
  leads_completed: number;
  timestamp: string;
}

/**
 * Analyze the low conversion pipeline using LLM
 */
export const analyzeLowConversionPipeline = async (days: number = 30): Promise<ApiResponse<AnalysisResponse> | ApiError> => {
  try {
    const response = await apiClient.post<AnalysisResponse>('/api/low-probability-workflow/analyze', { days });
    return response;
  } catch (error) {
    console.error('Error analyzing low conversion pipeline:', error);
    return { error };
  }
};

/**
 * Generate personalized content for a lead in the low conversion pipeline
 */
export const generateLowConversionContent = async (
  leadId: number, 
  templateType: string,
  cycle: number = 0
): Promise<ApiResponse<ContentResponse> | ApiError> => {
  try {
    const response = await apiClient.post<ContentResponse>(`/api/low-probability-workflow/leads/${leadId}/generate-content`, {
      template_type: templateType,
      cycle
    });
    return response;
  } catch (error) {
    console.error('Error generating content for low conversion lead:', error);
    return { error };
  }
};

/**
 * Run the low conversion workflow (admin/marketer only)
 */
export const runLowConversionWorkflow = async (): Promise<ApiResponse<WorkflowRunResponse> | ApiError> => {
  try {
    const response = await apiClient.post<WorkflowRunResponse>('/api/low-probability-workflow/run', {});
    return response;
  } catch (error) {
    console.error('Error running low conversion workflow:', error);
    return { error };
  }
};

/**
 * Manually upgrade a lead from the low conversion pipeline
 */
export const manuallyUpgradeLead = async (leadId: number, notes?: string): Promise<ApiResponse<{success: boolean}> | ApiError> => {
  try {
    const response = await apiClient.post<{success: boolean}>(`/api/low-probability-workflow/leads/${leadId}/manual-upgrade`, { 
      notes 
    });
    return response;
  } catch (error) {
    console.error('Error manually upgrading lead:', error);
    return { error };
  }
};

/**
 * Get scheduled content for a lead in the low conversion pipeline
 */
export const getScheduledContent = async (leadId: number): Promise<ApiResponse<any[]> | ApiError> => {
  try {
    const response = await apiClient.get<any[]>(`/api/low-probability-workflow/leads/${leadId}/scheduled-content`);
    return response;
  } catch (error) {
    console.error('Error fetching scheduled content:', error);
    return { error };
  }
}; 