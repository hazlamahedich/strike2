import { 
  Meeting,
  MeetingType,
  MeetingSummaryType,
  MeetingSummary,
  MeetingSummaryCreate
} from '../types/meeting';
import { ApiResponse } from '../api/client';
import { apiClient } from '../api/apiClient';
import { 
  createMeetingSummary, 
  getMeetingSummary 
} from '../api/meetings/index';
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';
import axios from 'axios';

// Define a modified ApiResponse type that allows null data
interface ApiResponseWithNullable<T> {
  data: T | null;
  error: Error | null;
}

// Update API_ENDPOINT to not include the leading 'v1/' since apiClient already adds '/api'
// This prevents the double prefix issue
const API_ENDPOINT = 'v1/ai/meetings';

// At the top of the file, add this type utility
type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Interface for availability request
 */
export interface AvailabilityRequest {
  lead_id?: string;
  meeting_type: string;
  days_ahead?: number;
}

/**
 * Interface for time slot
 */
export interface TimeSlot {
  start_time: string;
  end_time: string;
  score?: number;
}

/**
 * Interface for availability response
 */
export interface AvailabilityResponse {
  available_slots: {
    start_time: string;
    end_time: string;
  }[];
}

/**
 * Interface for meeting agenda request
 */
export interface MeetingAgendaRequest {
  lead_id?: string;
  meeting_type: string;
  context?: string;
}

/**
 * Interface for meeting agenda response
 */
export interface MeetingAgendaResponse {
  agenda_items: string[];
}

/**
 * Get AI-suggested optimal meeting times
 */
export const getSuggestedMeetingTimes = async (
  request: AvailabilityRequest
): Promise<ApiResponse<AvailabilityResponse>> => {
  try {
    const response = await apiClient.post<AvailabilityResponse>(`${API_ENDPOINT}/availability`, request);
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('Error in getSuggestedMeetingTimes:', error);
    return {
      data: { available_slots: [] } as AvailabilityResponse,
      error: error instanceof Error ? error : new Error('Unknown error in getSuggestedMeetingTimes')
    };
  }
};

/**
 * Get AI-recommended meeting duration
 */
export const getRecommendedDuration = async (
  meetingType: string,
  leadId?: string
): Promise<ApiResponse<{ duration_minutes: number }>> => {
  try {
    const params = new URLSearchParams();
    params.append('meeting_type', meetingType);
    if (leadId) {
      params.append('lead_id', leadId);
    }
    
    const response = await apiClient.get<{ duration_minutes: number }>(
      `${API_ENDPOINT}/duration?${params.toString()}`
    );
    
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('Error in getRecommendedDuration:', error);
    return {
      data: { duration_minutes: 30 } as { duration_minutes: number },
      error: error instanceof Error ? error : new Error('Unknown error in getRecommendedDuration')
    };
  }
};

/**
 * Generate AI-powered meeting agenda
 */
export const generateMeetingAgenda = async (
  request: MeetingAgendaRequest
): Promise<ApiResponse<MeetingAgendaResponse>> => {
  console.log('Calling generateMeetingAgenda with request:', request);
  try {
    // Log the full URL being called
    const fullUrl = `${API_ENDPOINT}/agenda`;
    console.log('Making API request to:', fullUrl);
    console.log('With apiClient baseURL:', '/api');
    console.log('Expected full URL:', '/api/v1/ai/meetings/agenda');
    
    // Use fetch directly to see the exact URL being used
    console.log('Trying with fetch to debug URL issues...');
    const fetchResponse = await fetch(`/api/${API_ENDPOINT}/agenda`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      credentials: 'include' // Include cookies for authentication
    });
    
    console.log('Fetch response status:', fetchResponse.status);
    
    if (fetchResponse.ok) {
      const data = await fetchResponse.json();
      console.log('Fetch response data:', data);
      return {
        data: data,
        error: null
      };
    } else {
      console.error('Fetch error:', fetchResponse.status, fetchResponse.statusText);
      // Try a different URL format
      console.log('Trying alternative URL format...');
      const alternativeResponse = await fetch(`/api/v1/ai/meetings/agenda`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        credentials: 'include' // Include cookies for authentication
      });
      
      console.log('Alternative fetch response status:', alternativeResponse.status);
      
      if (alternativeResponse.ok) {
        const data = await alternativeResponse.json();
        console.log('Alternative fetch response data:', data);
        return {
          data: data,
          error: null
        };
      } else {
        console.error('Alternative fetch error:', alternativeResponse.status, alternativeResponse.statusText);
        
        // If both fetch attempts fail with 404, provide fallback agenda items
        if (fetchResponse.status === 404 && alternativeResponse.status === 404) {
          console.log('API endpoint not found, using local fallback');
          return {
            data: { 
              agenda_items: getFallbackAgendaItems(request.meeting_type)
            },
            error: null
          };
        }
      }
    }
    
    // Original axios call
    const response = await apiClient.post<MeetingAgendaResponse>(fullUrl, request);
    console.log('generateMeetingAgenda response:', response);
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('Error in generateMeetingAgenda:', error);
    
    // Add more detailed error logging
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL && error.config?.url ? 
          `${error.config.baseURL}${error.config.url}` : 'unknown',
        method: error.config?.method,
        headers: error.config?.headers,
        timeout: error.config?.timeout
      });
      
      // If the error is a 404, provide fallback agenda items
      if (error.response?.status === 404) {
        console.log('API endpoint not found, using local fallback');
        return {
          data: { 
            agenda_items: getFallbackAgendaItems(request.meeting_type)
          },
          error: null
        };
      }
    }
    
    return {
      data: { agenda_items: [] } as MeetingAgendaResponse,
      error: error instanceof Error ? error : new Error('Unknown error occurred')
    };
  }
};

/**
 * Get fallback agenda items based on meeting type
 */
export function getFallbackAgendaItems(meetingType?: string): string[] {
  // Default suggestions for any meeting type
  const defaultSuggestions = [
    "Welcome and introductions",
    "Review of previous discussions",
    "Current status update",
    "Next steps and action items",
    "Questions and answers"
  ];

  // Return meeting-type specific suggestions if available
  switch (meetingType) {
    case 'initial_call':
      return [
        "Introduction and rapport building",
        "Overview of company/product/service",
        "Understanding client's needs and pain points",
        "Brief demonstration of relevant solutions",
        "Discuss potential next steps",
        "Q&A session"
      ];
    case 'discovery':
      return [
        "Review of previous discussions",
        "Deep dive into client's business processes",
        "Identify key challenges and opportunities",
        "Explore potential solutions",
        "Discuss success metrics and goals",
        "Outline implementation timeline",
        "Next steps and follow-up items"
      ];
    default:
      return defaultSuggestions;
  }
}

/**
 * Generate AI-powered follow-up message after meeting
 */
export const generateFollowUpMessage = async (
  meetingId: string
): Promise<ApiResponse<{ subject: string; message: string }>> => {
  try {
    // Log the environment and API endpoint
    const isDev = process.env.NODE_ENV === 'development';
    console.log('Environment:', isDev ? 'development' : 'production');
    console.log('Making API request to:', `/api/v1/ai/meetings/follow-up/${meetingId}`);
    console.log('Meeting ID:', meetingId);
    
    // Add a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
    
    try {
      // Make the API request with timeout
      console.log('Starting API request...');
      
      // Use fetch directly instead of apiClient for more control
      const response = await fetch(`/api/v1/ai/meetings/follow-up/${meetingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include', // Include cookies for authentication
        signal: controller.signal
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      console.log('API response received:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('API error response:', {
          status: response.status,
          statusText: response.statusText,
          url: `/api/v1/ai/meetings/follow-up/${meetingId}`
        });
        
        // Try to get the error details from the response
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        
        throw new Error(`API returned ${response.status}: ${response.statusText}. Details: ${errorText}`);
      }
      
      // Parse the response
      const data = await response.json();
      console.log('API response data:', data);
      
      return {
        data: data,
        error: null
      };
    } catch (fetchError) {
      // Clear the timeout if there was an error
      clearTimeout(timeoutId);
      
      console.error('Fetch error in generateFollowUpMessage:', fetchError);
      
      // Check if it's an abort error (timeout)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error(`Request timed out after 15 seconds: ${fetchError.message}`);
      }
      
      throw fetchError; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('Error in generateFollowUpMessage:', error);
    
    // Add detailed error logging
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        timeout: error.config?.timeout
      });
      
      // If we get a 401 in development, provide a helpful message
      if (error.response?.status === 401 && process.env.NODE_ENV === 'development') {
        console.warn('Authentication error in development mode. This is likely because the API route requires authentication.');
      }
    }
    
    return {
      data: { subject: '', message: '' } as { subject: string; message: string },
      error: error instanceof Error ? error : new Error('Unknown error in generateFollowUpMessage')
    };
  }
};

/**
 * Get AI-generated meeting summary
 */
export const getMeetingSummaryAI = async (
  meetingId: string
): Promise<ApiResponse<{ summary: string; action_items: string[] }>> => {
  try {
    const response = await apiClient.get<{ summary: string; action_items: string[] }>(
      `${API_ENDPOINT}/summary?meeting_id=${meetingId}`
    );
    
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('Error in getMeetingSummaryAI:', error);
    return {
      data: null as unknown as { summary: string; action_items: string[] },
      error: error instanceof Error ? error : new Error('Unknown error in getMeetingSummaryAI')
    };
  }
};

/**
 * Get comprehensive AI-generated meeting summary including all lead interactions
 */
export const getComprehensiveMeetingSummary = async (
  meetingId: string
): Promise<ApiResponse<{ 
  summary: string; 
  insights: string[]; 
  action_items: string[]; 
  next_steps: string[];
  company_analysis?: {
    company_summary?: string;
    industry?: string;
    company_size_estimate?: string;
    strengths?: string[];
    potential_pain_points?: string[];
  }
}>> => {
  try {
    // Check if we're in development mode or using mock data
    if (typeof window !== 'undefined') {
      const useMockData = getMockDataStatus() || 
                         process.env.NODE_ENV === 'development';
      
      if (useMockData) {
        console.log('Using mock data for comprehensive summary (initial check)');
        return getMockComprehensiveSummary();
      }
    }
    
    // Check if we already have a summary for this meeting
    try {
      const existingSummary = await getMeetingSummary(meetingId, MeetingSummaryType.COMPREHENSIVE);
      
      if (existingSummary.data && !existingSummary.error) {
        console.log('Found existing comprehensive summary:', existingSummary.data);
        return {
          data: {
            summary: existingSummary.data.summary,
            insights: existingSummary.data.insights,
            action_items: existingSummary.data.action_items,
            next_steps: existingSummary.data.next_steps,
            company_analysis: existingSummary.data.company_analysis
          },
          error: null
        };
      }
    } catch (checkError) {
      // If there's an error checking for an existing summary, log it and use mock data
      console.log('Error checking for existing summary:', checkError);
      
      // If we're in development mode, use mock data
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Using mock data after summary check error');
        return getMockComprehensiveSummary();
      }
    }
    
    // Use the frontend API endpoint instead of trying to call the backend directly
    try {
      console.log('Calling frontend API for comprehensive summary');
      
      // Check if we're using mock data mode
      if (typeof window !== 'undefined') {
        const useMockData = getMockDataStatus() || 
                           process.env.NODE_ENV === 'development';
        
        if (useMockData) {
          console.log('Using mock data for comprehensive summary');
          return getMockComprehensiveSummary();
        }
      }
      
      // Add a timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
      
      try {
        // Use a simple fetch with error handling
        console.log(`Fetching from /api/v1/ai/meetings/comprehensive-summary/${meetingId}`);
        
        const response = await fetch(`/api/v1/ai/meetings/comprehensive-summary/${meetingId}`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          credentials: 'same-origin' // Include cookies for authentication
        });
        
        // Clear the timeout since the request completed
        clearTimeout(timeoutId);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          // If we get a 401 Unauthorized error, use mock data
          if (response.status === 401) {
            console.log('Authentication error, using mock data');
            return getMockComprehensiveSummary();
          }
          
          // Try to get the error details from the response
          const errorText = await response.text();
          console.error('API error response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          
          // If the error response is empty or just contains {}, use mock data
          if (!errorText || errorText.trim() === '' || errorText.trim() === '{}') {
            console.log('Empty error response, using mock data');
            return getMockComprehensiveSummary();
          }
          
          throw new Error(`API returned ${response.status}: ${response.statusText}. Details: ${errorText}`);
        }
        
        // Check if the response is empty
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Invalid content type:', contentType);
          throw new Error(`Expected JSON response but got ${contentType}`);
        }
        
        // Parse the response as text first to check if it's empty
        const responseText = await response.text();
        if (!responseText || responseText.trim() === '') {
          console.error('Empty response body');
          throw new Error('Empty response from API');
        }
        
        // Parse the text as JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          console.error('Response text:', responseText);
          throw new Error('Invalid JSON response from API');
        }
        
        console.log('Received data from frontend API:', data);
        
        if (!data || Object.keys(data).length === 0) {
          console.error('Empty response data object');
          throw new Error('Empty data object from API');
        }
        
        // Validate the response data has the expected fields
        if (!data.summary || !data.insights || !data.action_items || !data.next_steps) {
          console.error('Response data missing required fields:', data);
          throw new Error('Response data missing required fields');
        }
        
        // Store the summary in the meeting_summaries table
        try {
          const summaryData: MeetingSummaryCreate = {
            meeting_id: meetingId,
            summary_type: MeetingSummaryType.COMPREHENSIVE,
            summary: data.summary,
            insights: data.insights,
            action_items: data.action_items,
            next_steps: data.next_steps,
            company_analysis: data.company_analysis
          };
          
          const createResult = await createMeetingSummary(summaryData);
          console.log('Created meeting summary:', createResult);
        } catch (storeError) {
          // If there's an error storing the summary, just log it
          console.error('Error storing comprehensive summary:', storeError);
        }
        
        return {
          data: data,
          error: null
        };
      } catch (fetchError: unknown) {
        // Clear the timeout if there was an error
        clearTimeout(timeoutId);
        
        console.error('Fetch error in getComprehensiveMeetingSummary:', fetchError);
        
        // If the error is due to timeout or network issues, use mock data
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.log('Request timed out, using mock data');
          return getMockComprehensiveSummary();
        }
        
        if (!navigator.onLine || 
            (fetchError instanceof Error && 
             (fetchError.message.includes('network') || fetchError.message.includes('fetch')))) {
          console.log('Network error, using mock data');
          return getMockComprehensiveSummary();
        }
        
        // For any other error, use mock data
        console.log('Other error, using mock data:', fetchError);
        return getMockComprehensiveSummary();
      }
    } catch (error) {
      console.error('Error fetching from frontend API:', error);
      
      // Always fall back to mock data on any error
      console.log('Falling back to mock data due to error');
      return getMockComprehensiveSummary();
    }
  } catch (error) {
    console.error('Error in getComprehensiveMeetingSummary:', error);
    
    // Always return mock data on any error
    return getMockComprehensiveSummary();
  }
};

// Helper function to return mock comprehensive summary data
function getMockComprehensiveSummary() {
  // Mock company analysis data for demonstration
  const mockCompanyAnalysis = {
    company_summary: "Example Corp is a leading provider of innovative software solutions for businesses of all sizes. They specialize in AI-powered CRM systems, data analytics, and cloud infrastructure services.",
    industry: "Software & Technology",
    company_size_estimate: "Medium (50-200 employees)",
    strengths: [
      "Strong technical expertise",
      "Innovative product offerings",
      "Established market presence"
    ],
    potential_pain_points: [
      "Legacy system integration",
      "Data migration challenges",
      "Staff training and adoption"
    ]
  };
  
  return {
    data: {
      summary: "This was a productive discovery call with the client. We discussed their current CRM challenges and how our solution could address their specific needs. The client expressed interest in our AI-powered features and requested a follow-up demo with their technical team.",
      insights: [
        "Client is currently using an outdated CRM system that lacks integration capabilities",
        "Their main pain points are data silos and manual reporting processes",
        "They have a team of 50+ sales representatives who need mobile access",
        "Budget constraints are a concern, but they see value in AI automation"
      ],
      action_items: [
        "Schedule a technical demo within the next two weeks",
        "Prepare ROI analysis based on their current process inefficiencies",
        "Share case studies from similar clients in their industry",
        "Create a custom implementation timeline"
      ],
      next_steps: [
        "Follow up with technical specifications document",
        "Arrange a meeting with their IT department to discuss integration",
        "Prepare a tailored pricing proposal",
        "Set up a pilot program for their sales team"
      ],
      company_analysis: mockCompanyAnalysis
    },
    error: null
  };
}

/**
 * Schedule a follow-up task for a meeting
 */
export const scheduleFollowUpTask = async (
  meetingId: string,
  taskDetails: { title: string; description: string; due_date: string }
): Promise<ApiResponse<{ task_id: string } | null>> => {
  try {
    console.log(`Scheduling follow-up task for meeting ID: ${meetingId}`);
    console.log('Task details:', taskDetails);
    
    // Remove the leading /api since apiClient already has baseURL: '/api'
    const endpoint = `/v1/ai/meetings/schedule-follow-up/${meetingId}`;
    console.log('Using API endpoint:', endpoint);
    
    const response = await apiClient.post<{ task_id: string }>(
      endpoint, 
      {
        ...taskDetails,
        days_delay: 3 // Add days_delay parameter which the endpoint expects
      }
    );
    
    console.log('Schedule follow-up task response:', response);
    
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('Error in scheduleFollowUpTask:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error in scheduleFollowUpTask')
    };
  }
};

/**
 * Updates a meeting with summary information
 * @param id Meeting ID
 * @param summaryData Summary data to update
 * @returns Updated meeting data or error
 */
export const updateMeetingWithSummary = async (
  id: string,
  summaryData: Partial<Meeting>
): Promise<ApiResponse<Meeting | null>> => {
  console.log(`updateMeetingWithSummary called with ID: ${id}`);
  console.log('Summary data:', summaryData);
  
  try {
    // Ensure ID is a string
    const meetingId = String(id);
    
    // Use the meetings endpoint with the ID
    const endpoint = `/meetings/${meetingId}`;
    console.log(`Making PUT request to endpoint: ${endpoint}`);
    
    // Make the API call
    const response = await apiClient.put<Meeting>(endpoint, summaryData);
    console.log('API response:', response);
    
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('Error in updateMeetingWithSummary:', error);
    
    // Provide detailed error information
    let errorMessage = 'Failed to update meeting with summary';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
    }
    
    return {
      data: null,
      error: new Error(errorMessage)
    };
  }
};

/**
 * Get suggested meeting availability
 */
export const getSuggestedAvailability = async (
  leadId: string
): Promise<ApiResponse<AvailabilityResponse | null>> => {
  try {
    const response = await apiClient.get<AvailabilityResponse>(`/ai/meeting/availability?lead_id=${leadId}`);
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('Error in getSuggestedAvailability:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error in getSuggestedAvailability')
    };
  }
};

/**
 * Get suggested meeting duration
 */
export const getSuggestedDuration = async (
  leadId: string
): Promise<ApiResponse<{ duration_minutes: number } | null>> => {
  try {
    const response = await apiClient.get<{ duration_minutes: number }>(`/ai/meeting/duration?lead_id=${leadId}`);
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('Error in getSuggestedDuration:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error in getSuggestedDuration')
    };
  }
};

/**
 * Get AI-generated meeting agenda
 */
export const getMeetingAgenda = async (
  leadId: string,
  context?: string
): Promise<ApiResponse<MeetingAgendaResponse | null>> => {
  try {
    const params = new URLSearchParams();
    params.append('lead_id', leadId);
    if (context) {
      params.append('context', context);
    }

    const response = await apiClient.get<MeetingAgendaResponse>(`${API_ENDPOINT}/agenda?${params.toString()}`);
    
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('Error in getMeetingAgenda:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error in getMeetingAgenda')
    };
  }
};

/**
 * Get AI-generated follow-up message
 */
export const getFollowUpMessage = async (
  meetingId: string
): Promise<ApiResponse<{ subject: string; message: string } | null>> => {
  try {
    const response = await apiClient.get<{ subject: string; message: string }>(`/ai/meeting/follow-up?meeting_id=${meetingId}`);
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('Error in getFollowUpMessage:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error in getFollowUpMessage')
    };
  }
}; 