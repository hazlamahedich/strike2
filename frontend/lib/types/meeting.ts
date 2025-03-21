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

// Meeting type enum
export enum MeetingType {
  INITIAL_CALL = 'INITIAL_CALL',
  DISCOVERY = 'DISCOVERY',
  DEMO = 'DEMO',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  FOLLOW_UP = 'FOLLOW_UP',
  ONBOARDING = 'ONBOARDING',
  REVIEW = 'REVIEW',
  OTHER = 'OTHER',
}

// Meeting status enum
export enum MeetingStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
  NO_SHOW = 'NO_SHOW',
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

// Meeting interface
export interface Meeting {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  meeting_type: MeetingType;
  status: MeetingStatus;
  lead_id?: string;
  lead?: Lead;
  notes?: string;
  agenda_items?: string[];
  created_at: string;
  updated_at: string;
  // Attendees
  attendees?: Array<{
    email: string;
    role?: 'primary' | 'to' | 'cc' | 'bcc';
    name?: string;
  }>;
  // Summary fields
  summary?: string;
  action_items?: string[];
  // Attachments
  attachments?: Array<{
    filename: string;
    path: string;
    content_type: string;
    size: number;
  }>;
  // Display attachments (for UI only)
  displayAttachments?: Array<{
    id: string;
    filename: string;
    path: string;
    content_type: string;
    size: number;
    url?: string;
  }>;
  // Version tracking
  current_note_version_id?: string;
  // Comprehensive summary fields
  comprehensive_summary?: {
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
    };
  };
}

// Meeting summary type enum
export enum MeetingSummaryType {
  BASIC = 'basic',
  COMPREHENSIVE = 'comprehensive',
}

// Meeting summary interface
export interface MeetingSummary {
  id: string;
  meeting_id: string;
  summary_type: MeetingSummaryType;
  summary: string;
  insights: string[];
  action_items: string[];
  next_steps: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  company_analysis?: {
    company_summary?: string;
    industry?: string;
    company_size_estimate?: string;
    strengths?: string[];
    potential_pain_points?: string[];
  };
}

// Meeting summary create interface
export interface MeetingSummaryCreate {
  meeting_id: string;
  summary_type: MeetingSummaryType;
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
  };
}

// Meeting summary update interface
export interface MeetingSummaryUpdate {
  summary?: string;
  insights?: string[];
  action_items?: string[];
  next_steps?: string[];
}

// Meeting create interface
export interface MeetingCreate {
  lead_id?: string;
  lead_email: string;
  lead_phone?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  timezone?: string;
  meeting_type: MeetingType;
  location?: string;
  status?: MeetingStatus;
  notes?: string;
  agenda_items?: string[];
  // Attendees
  attendees?: Array<{
    email: string;
    role?: 'primary' | 'to' | 'cc' | 'bcc';
    name?: string;
  }>;
}

// Meeting update interface
export interface MeetingUpdate {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  meeting_type?: MeetingType;
  status?: MeetingStatus;
  lead_id?: string;
  notes?: string;
  agenda_items?: string[];
  // Summary fields
  summary?: string;
  action_items?: string[];
  // Attachments
  attachments?: Array<{
    filename: string;
    path: string;
    content_type: string;
    size: number;
  }>;
  // Version tracking
  current_note_version_id?: string;
  // Comprehensive summary fields
  comprehensive_summary?: {
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
    };
  };
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