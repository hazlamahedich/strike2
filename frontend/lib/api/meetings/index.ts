import { 
  Meeting, 
  MeetingCreate, 
  MeetingUpdate, 
  AvailabilityRequest, 
  AvailabilityResponse 
} from '../../types/meeting';
import apiClient from '../client';

const API_ENDPOINT = 'api/v1/meetings';

export const getMeetings = async (): Promise<Meeting[]> => {
  return apiClient.get<Meeting[]>(API_ENDPOINT);
};

export const getUpcomingMeetings = async (days: number = 7): Promise<Meeting[]> => {
  return apiClient.get<Meeting[]>(`${API_ENDPOINT}/upcoming?days=${days}`);
};

export const getMeeting = async (id: number): Promise<Meeting> => {
  return apiClient.get<Meeting>(`${API_ENDPOINT}/${id}`);
};

export const createMeeting = async (meeting: MeetingCreate): Promise<Meeting> => {
  return apiClient.post<Meeting>(API_ENDPOINT, meeting);
};

export const updateMeeting = async (id: number, meeting: MeetingUpdate): Promise<Meeting> => {
  return apiClient.put<Meeting>(`${API_ENDPOINT}/${id}`, meeting);
};

export const deleteMeeting = async (id: number): Promise<{ success: boolean }> => {
  return apiClient.delete<{ success: boolean }>(`${API_ENDPOINT}/${id}`);
};

export const getAvailability = async (request: AvailabilityRequest): Promise<AvailabilityResponse> => {
  return apiClient.post<AvailabilityResponse>(`${API_ENDPOINT}/availability`, request);
}; 