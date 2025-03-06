import { Lead } from './lead';

// Define User interface directly here to avoid import issues
export interface User {
  id: number;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  team_id?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export enum MeetingType {
  INITIAL_CALL = "initial_call",
  DISCOVERY = "discovery",
  DEMO = "demo",
  PROPOSAL = "proposal",
  NEGOTIATION = "negotiation",
  FOLLOW_UP = "follow_up",
  OTHER = "other"
}

export enum MeetingStatus {
  SCHEDULED = "scheduled",
  CONFIRMED = "confirmed",
  CANCELED = "canceled",
  COMPLETED = "completed",
  RESCHEDULED = "rescheduled",
  NO_SHOW = "no_show"
}

export enum MeetingLocationType {
  VIRTUAL = "virtual",
  IN_PERSON = "in_person",
  PHONE = "phone"
}

export interface MeetingAttendee {
  id?: string;
  meeting_id?: string;
  name: string;
  email: string;
  status: string;
  is_organizer?: boolean;
  lead_id?: string;
  user_id?: string;
}

export interface MeetingLocation {
  type: MeetingLocationType;
  address?: string;
  virtual_link?: string;
  phone_number?: string;
  conference_details?: Record<string, any>;
}

export interface Meeting {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  timezone?: string;
  status: MeetingStatus;
  location?: string;
  meeting_type: MeetingType;
  lead_id: number;
  user_id: number;
  calendar_id?: string;
  meeting_url?: string;
  created_at: string;
  updated_at: string;
  lead?: Lead;
  organizer?: User;
  attendees?: MeetingAttendee[];
}

export interface MeetingCreate {
  lead_id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  timezone?: string;
  meeting_type: MeetingType;
  location?: string;
  lead_email: string;
}

export interface MeetingUpdate {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  timezone?: string;
  meeting_type?: MeetingType;
  location?: string;
  status?: MeetingStatus;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
}

export interface AvailabilityRequest {
  start_date: string;
  end_date: string;
  duration_minutes?: number;
  timezone?: string;
}

export interface AvailabilityResponse {
  available_slots: TimeSlot[];
} 