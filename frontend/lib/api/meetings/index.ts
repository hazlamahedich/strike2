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

const API_ENDPOINT = 'meetings';

/**
 * Get all meetings
 */
export const getMeetings = async (): Promise<ApiResponse<Meeting[]>> => {
  try {
    // Check if we're in development mode and should use mock data
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || 
        (typeof window !== 'undefined' && localStorage.getItem('useMockData') === 'true')) {
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
    const response = await apiClient.post<Meeting>('/meetings', meeting);
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    return {
      data: null as unknown as Meeting,
      error: error instanceof Error ? error : new Error('Unknown error in createMeeting')
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
    const response = await apiClient.put<Meeting>(`/meetings/${meetingId}`, meeting);
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
    const response = await apiClient.post<MeetingSummary>('/meetings/summaries', summary);
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
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
    const response = await apiClient.get<MeetingSummary>(`/meetings/summaries/${meetingId}/${summaryType}`);
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
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