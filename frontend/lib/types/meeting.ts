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

export interface MeetingContact {
  name: string;
  email?: string;
  phone?: string;
}

export interface Meeting {
  id: number;
  lead_id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  status: MeetingStatus;
  notes?: string;
  created_by?: string; // UUID of the user who created the meeting
  
  // These fields are not in the database but used in the frontend
  timezone?: string;
  meeting_type?: MeetingType;
  user_id?: number;
  calendar_id?: string;
  meeting_url?: string;
  created_at?: string;
  updated_at?: string;
  lead?: Lead;
  organizer?: User;
  attendees?: MeetingAttendee[];
  contact?: MeetingContact;
}

export interface MeetingCreate {
  lead_id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  status?: MeetingStatus;
  notes?: string;
  created_by?: string; // UUID of the user who created the meeting
  
  // Additional fields used in the frontend but not required by the database
  timezone?: string;
  meeting_type?: MeetingType;
  lead_email?: string; // Used for sending invitations
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