/**
 * Mock API Service
 * 
 * This file provides mock implementations of API endpoints for development
 * when the backend is not available. It's used as a fallback in the API client.
 */

import { Meeting, MeetingStatus, MeetingType } from '../types/meeting';
import { LeadStatus, LeadSource } from '../types/lead';

// Types
type User = {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
};

type Notification = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_read: boolean;
};

// Define a type for the mock endpoints
type MockEndpointHandler = () => any;
type MockEndpoints = {
  [key: string]: MockEndpointHandler;
};

// Mock data
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Welcome to AI CRM',
    content: 'Thanks for joining our platform. Get started by exploring the dashboard.',
    created_at: new Date().toISOString(),
    is_read: false
  },
  {
    id: '2',
    title: 'New Lead Assigned',
    content: 'A new lead has been assigned to you. Check the leads section.',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    is_read: false
  }
];

// Mock data for meetings
const mockMeetings: Meeting[] = [
  {
    id: 1,
    title: 'Initial Discovery Call',
    description: 'Discuss project requirements and timeline',
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour later
    status: MeetingStatus.SCHEDULED,
    meeting_type: MeetingType.DISCOVERY,
    lead_id: 1,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lead: {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      company: 'Acme Inc.',
      status: LeadStatus.NEW,
      source: LeadSource.WEBSITE,
      custom_fields: {},
      lead_score: 80,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      full_name: 'John Doe'
    }
  },
  {
    id: 2,
    title: 'Product Demo',
    description: 'Showcase our product features and benefits',
    start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days later
    end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(), // 1.5 hours later
    status: MeetingStatus.CONFIRMED,
    meeting_type: MeetingType.DEMO,
    lead_id: 2,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lead: {
      id: 2,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      company: 'XYZ Corp',
      status: LeadStatus.QUALIFIED,
      source: LeadSource.REFERRAL,
      custom_fields: {},
      lead_score: 90,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      full_name: 'Jane Smith'
    }
  },
  {
    id: 3,
    title: 'Contract Negotiation',
    description: 'Discuss contract terms and pricing',
    start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    end_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour later
    status: MeetingStatus.COMPLETED,
    meeting_type: MeetingType.NEGOTIATION,
    lead_id: 3,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lead: {
      id: 3,
      first_name: 'Robert',
      last_name: 'Johnson',
      email: 'robert.johnson@example.com',
      company: 'Johnson & Co',
      status: LeadStatus.NEGOTIATION,
      source: LeadSource.LINKEDIN,
      custom_fields: {},
      lead_score: 95,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      full_name: 'Robert Johnson'
    }
  },
  {
    id: 4,
    title: 'Follow-up Call',
    description: 'Check in on implementation progress',
    start_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    end_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // 30 minutes later
    status: MeetingStatus.CANCELED,
    meeting_type: MeetingType.FOLLOW_UP,
    lead_id: 1,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lead: {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      company: 'Acme Inc.',
      status: LeadStatus.NEW,
      source: LeadSource.WEBSITE,
      custom_fields: {},
      lead_score: 80,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      full_name: 'John Doe'
    }
  }
];

// Mock API endpoints
const mockEndpoints: MockEndpoints = {
  // Auth endpoints
  'auth/me': () => {
    const storedUser = localStorage.getItem('strike_app_user');
    if (!storedUser) {
      throw new Error('User not found');
    }
    
    const user = JSON.parse(storedUser);
    return {
      id: user.id,
      email: user.email,
      full_name: user.name,
      role: user.role || 'user'
    };
  },
  
  'auth/logout': () => {
    localStorage.removeItem('strike_app_user');
    return { success: true };
  },
  
  // Notification endpoints
  'notifications/unread': () => {
    return mockNotifications;
  },
  
  // Meetings endpoints
  'api/v1/meetings': () => mockMeetings,
  'api/v1/meetings/upcoming': () => mockMeetings,
  
  // Add more mock endpoints as needed
};

// Helper function to get mock data for an endpoint
export function getMockData(endpoint: string): any {
  const handler = mockEndpoints[endpoint];
  if (!handler) {
    throw new Error(`No mock implementation for endpoint: ${endpoint}`);
  }
  
  return handler();
}

// Check if we should use mock data
export function shouldUseMockData(): boolean {
  // Use mock data in development mode when using local storage auth
  return process.env.NODE_ENV === 'development' && 
         typeof window !== 'undefined' && 
         Boolean(localStorage.getItem('strike_app_user'));
}

export default {
  getMockData,
  shouldUseMockData
}; 