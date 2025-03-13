import { get, post, put, del } from './apiClient';
import { Meeting, MeetingUpdate } from '@/lib/types/meeting';

// Update API_ENDPOINT to not include the leading '/api' since apiClient already adds it
const API_ENDPOINT = 'v1/meetings';

// Get all meetings
export const getMeetings = async () => {
  return get<Meeting[]>(API_ENDPOINT);
};

// Get a specific meeting by ID
export const getMeeting = async (id: string) => {
  return get<Meeting>(`${API_ENDPOINT}/${id}`);
};

// Get upcoming meetings
export const getUpcomingMeetings = async (limit?: number) => {
  const params = limit ? { limit } : undefined;
  return get<Meeting[]>(`${API_ENDPOINT}/upcoming`, params);
};

// Create a new meeting
export const createMeeting = async (meetingData: Partial<Meeting>) => {
  return post<Meeting>(API_ENDPOINT, meetingData);
};

// Update an existing meeting
export const updateMeeting = async (id: string, updateData: MeetingUpdate) => {
  return put<Meeting>(`${API_ENDPOINT}/${id}`, updateData);
};

// Delete a meeting
export const deleteMeeting = async (id: string) => {
  return del<void>(`${API_ENDPOINT}/${id}`);
}; 