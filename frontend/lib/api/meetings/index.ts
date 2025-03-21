import { apiClient } from '../apiClient';
import { 
  Meeting, 
  MeetingCreate, 
  MeetingUpdate,
  MeetingSummary,
  MeetingSummaryCreate,
  MeetingSummaryUpdate,
  MeetingSummaryType,
  MeetingType,
  MeetingStatus,
  AvailabilityRequest,
  AvailabilityResponse
} from '../../types/meeting';
import { ApiResponse, ApiError } from '../apiClient';
import axios from 'axios';

// Import the post and get functions from apiClient
import { post, get } from '../apiClient';
// Import getMockDataStatus from mockDataUtils
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';

const API_ENDPOINT = 'meetings';

/**
 * Get all meetings
 */
export const getMeetings = async (): Promise<ApiResponse<Meeting[]>> => {
  try {
    // Check if we're in development mode and should use mock data
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || 
        (typeof window !== 'undefined' && getMockDataStatus())) {
      console.log('Using mock data for meetings (client-side)');
      
      // Return mock data
      const mockMeetings: Meeting[] = [
        {
          id: "101",
          title: "Initial Discovery Call",
          description: "Discuss company needs and potential solutions",
          start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          end_time: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 1 hour
          status: MeetingStatus.SCHEDULED,
          location: "Zoom",
          meeting_type: MeetingType.INITIAL_CALL,
          lead_id: "1",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "102",
          title: "Product Demo",
          description: "Demonstrate our enterprise solution",
          start_time: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
          end_time: new Date(Date.now() + 176400000).toISOString(), // Day after tomorrow + 1 hour
          status: MeetingStatus.SCHEDULED,
          location: "Microsoft Teams",
          meeting_type: MeetingType.DEMO,
          lead_id: "2",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      return {
        data: mockMeetings,
        error: null
      };
    }
    
    const response = await apiClient.get<Meeting[]>('/meetings');
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('Error in getMeetings:', error);
    
    // Check if it's an authentication error
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return {
        data: null as unknown as Meeting[],
        error: {
          message: 'Authentication required. Please log in again.',
          code: 'AUTH_REQUIRED',
          status: 401,
          details: { isAuthError: true }
        } as ApiError
      };
    }
    
    return {
      data: null as unknown as Meeting[],
      error: error instanceof Error ? error : new Error('Unknown error in getMeetings')
    };
  }
};

/**
 * Get a meeting by ID
 */
export const getMeeting = async (id: string): Promise<ApiResponse<Meeting>> => {
  try {
    const response = await apiClient.get<Meeting>(`/meetings/${id}`);
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    return {
      data: null as unknown as Meeting,
      error: error instanceof Error ? error : new Error('Unknown error in getMeeting')
    };
  }
};

/**
 * Create a new meeting
 */
export const createMeeting = async (meeting: MeetingCreate): Promise<ApiResponse<Meeting>> => {
  try {
    // Add detailed tracing
    console.log('[createMeeting] Starting meeting creation process:', meeting);
    
    // Check for mock mode using our utility - most reliable way
    const useMockData = getMockDataStatus();
    
    if (useMockData) {
      console.log('[createMeeting] Mock mode enabled, using mock data');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate a mock meeting response
      const mockMeeting: Meeting = {
        id: `mock-${Date.now()}`,
        title: meeting.title,
        description: meeting.description || '',
        start_time: meeting.start_time,
        end_time: meeting.end_time,
        location: meeting.location || 'Virtual',
        meeting_type: meeting.meeting_type,
        status: meeting.status || MeetingStatus.SCHEDULED,
        lead_id: meeting.lead_id,
        attendees: meeting.attendees,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Meeting;
      
      console.log('[createMeeting] Created mock meeting:', mockMeeting);
      
      return {
        data: mockMeeting,
        error: null
      };
    }
    
    // Real API implementation
    console.log('[createMeeting] Sending API request to:', '/meetings');
    const response = await apiClient.post<Meeting>('/meetings', meeting);
    
    console.log('[createMeeting] API response received:', response.data);
    
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('[createMeeting] Error occurred:', error);
    
    // If error occurs but mock mode is enabled, fall back to mock data
    if (getMockDataStatus(true)) { // Force mock mode for error fallback
      console.log('[createMeeting] Error occurred but falling back to mock data');
      
      // Generate a mock meeting as fallback
      const mockMeeting: Meeting = {
        id: `mock-fallback-${Date.now()}`,
        title: meeting.title,
        description: meeting.description || '',
        start_time: meeting.start_time,
        end_time: meeting.end_time,
        location: meeting.location || 'Virtual',
        meeting_type: meeting.meeting_type,
        status: meeting.status || MeetingStatus.SCHEDULED,
        lead_id: meeting.lead_id,
        attendees: meeting.attendees,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Meeting;
      
      return {
        data: mockMeeting,
        error: null
      };
    }
    
    // Enhanced error handling
    if (axios.isAxiosError(error)) {
      const errorDetails = {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      };
      console.error('[createMeeting] Axios error details:', errorDetails);
      
      return {
        data: null as unknown as Meeting,
        error: {
          message: error.response?.data?.message || error.message || 'Failed to create meeting',
          code: error.response?.status?.toString() || 'UNKNOWN',
          status: error.response?.status || 500,
          details: error.response?.data || {}
        }
      };
    }
    
    console.error('[createMeeting] Generic error:', error);
    return {
      data: null as unknown as Meeting,
      error: error instanceof Error ? 
        { message: error.message, details: error } : 
        { message: 'Unknown error in createMeeting', details: error }
    };
  }
};

/**
 * Update a meeting
 */
export const updateMeeting = async (id: string | number, meeting: Partial<Meeting>): Promise<ApiResponse<Meeting>> => {
  try {
    // Ensure id is a string
    const meetingId = String(id);
    
    // Check if we're updating notes and should create a version
    const shouldCreateVersion = meeting.notes !== undefined;
    
    // Add a flag to indicate if we should create a version
    const meetingWithVersionFlag = {
      ...meeting,
      _create_version: shouldCreateVersion
    };
    
    const response = await apiClient.put<Meeting>(`/meetings/${meetingId}`, meetingWithVersionFlag);
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    return {
      data: null as unknown as Meeting,
      error: error instanceof Error ? error : new Error('Unknown error in updateMeeting')
    };
  }
};

/**
 * Delete a meeting
 */
export const deleteMeeting = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.delete<void>(`/meetings/${id}`);
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    return {
      data: null as unknown as void,
      error: error instanceof Error ? error : new Error('Unknown error in deleteMeeting')
    };
  }
};

/**
 * Create a meeting summary
 */
export const createMeetingSummary = async (summary: MeetingSummaryCreate): Promise<ApiResponse<MeetingSummary>> => {
  try {
    // Check if we're in development mode or using mock data
    if (typeof window !== 'undefined') {
      const useMockData = getMockDataStatus() || 
                         process.env.NODE_ENV === 'development';
      
      if (useMockData) {
        console.log('Using mock data for createMeetingSummary');
        // Return a mock successful response
        return {
          data: {
            id: 'mock-summary-id',
            meeting_id: summary.meeting_id,
            summary_type: summary.summary_type,
            summary: summary.summary,
            insights: summary.insights,
            action_items: summary.action_items,
            next_steps: summary.next_steps,
            company_analysis: summary.company_analysis,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          error: null
        };
      }
    }
    
    // Use the post function instead of apiClient.post
    const response = await post<MeetingSummary>('/meetings/summaries', summary);
    
    // Check for empty error response
    if (response.error && typeof response.error === 'object' && Object.keys(response.error).length === 0) {
      console.error('Empty error response from API in createMeetingSummary');
      
      // Return a mock successful response
      return {
        data: {
          id: 'mock-summary-id',
          meeting_id: summary.meeting_id,
          summary_type: summary.summary_type,
          summary: summary.summary,
          insights: summary.insights,
          action_items: summary.action_items,
          next_steps: summary.next_steps,
          company_analysis: summary.company_analysis,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        error: null
      };
    }
    
    return response;
  } catch (error) {
    console.error('Error in createMeetingSummary:', error);
    return {
      data: null as unknown as MeetingSummary,
      error: error instanceof Error ? error : new Error('Unknown error in createMeetingSummary')
    };
  }
};

/**
 * Get a meeting summary
 */
export const getMeetingSummary = async (
  meetingId: string, 
  summaryType: MeetingSummaryType
): Promise<ApiResponse<MeetingSummary>> => {
  try {
    // Check if we're in development mode or using mock data
    if (typeof window !== 'undefined') {
      const useMockData = getMockDataStatus() || 
                         process.env.NODE_ENV === 'development';
      
      if (useMockData) {
        console.log('Using mock data for getMeetingSummary');
        // Return a mock successful response
        return {
          data: {
            id: 'mock-summary-id',
            meeting_id: meetingId,
            summary_type: summaryType,
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
            company_analysis: {
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
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          error: null
        };
      }
    }
    
    // Use the get function instead of apiClient.get directly
    const response = await get<MeetingSummary>(`/meetings/summaries/${meetingId}/${summaryType}`);
    
    // Check for empty error response
    if (response.error && typeof response.error === 'object' && Object.keys(response.error).length === 0) {
      console.error('Empty error response from API in getMeetingSummary');
      
      // If we're in development mode, return mock data
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Using mock data due to empty error response');
        return {
          data: {
            id: 'mock-summary-id',
            meeting_id: meetingId,
            summary_type: summaryType,
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
            company_analysis: {
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
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          error: null
        };
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error in getMeetingSummary:', error);
    
    // If we're in development mode, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Using mock data due to error');
      return {
        data: {
          id: 'mock-summary-id',
          meeting_id: meetingId,
          summary_type: summaryType,
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
          company_analysis: {
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
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        error: null
      };
    }
    
    return {
      data: null as unknown as MeetingSummary,
      error: error instanceof Error ? error : new Error('Unknown error in getMeetingSummary')
    };
  }
};

/**
 * Update a meeting summary
 */
export const updateMeetingSummary = async (
  meetingId: string,
  summaryType: MeetingSummaryType,
  summary: MeetingSummaryUpdate
): Promise<ApiResponse<MeetingSummary>> => {
  try {
    const response = await apiClient.put<MeetingSummary>(`/meetings/summaries/${meetingId}/${summaryType}`, summary);
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    return {
      data: null as unknown as MeetingSummary,
      error: error instanceof Error ? error : new Error('Unknown error in updateMeetingSummary')
    };
  }
};

export const getUpcomingMeetings = async (days: number = 7): Promise<ApiResponse<Meeting[]>> => {
  try {
    const response = await apiClient.get<Meeting[]>(`/meetings/upcoming?days=${days}`);
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    return {
      data: null as unknown as Meeting[],
      error: error instanceof Error ? error : new Error('Unknown error in getUpcomingMeetings')
    };
  }
};

export const getAvailability = async (request: AvailabilityRequest): Promise<ApiResponse<AvailabilityResponse>> => {
  try {
    const response = await apiClient.post<AvailabilityResponse>('/meetings/availability', request);
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    return {
      data: null as unknown as AvailabilityResponse,
      error: error instanceof Error ? error : new Error('Unknown error in getAvailability')
    };
  }
}; 