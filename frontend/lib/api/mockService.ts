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

// Mock lead data
const mockLeads = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Smith',
    full_name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '(555) 123-4567',
    company: 'Smith Enterprises',
    title: 'CEO',
    source: LeadSource.WEBSITE,
    status: LeadStatus.NEW,
    owner_id: 1,
    team_id: 1,
    custom_fields: {
      address: '123 Main St, San Francisco, CA 94105'
    },
    lead_score: 8.5,
    conversion_probability: 0.65,
    created_at: '2023-05-15T10:30:00Z',
    updated_at: '2023-05-15T10:30:00Z',
    tasks: [
      { id: 1, title: 'Follow up call', due_date: '2023-05-20T14:00:00Z', completed: false },
      { id: 2, title: 'Send proposal', due_date: '2023-05-25T10:00:00Z', completed: false }
    ],
    emails: [
      { id: 1, subject: 'Introduction', sent_at: '2023-05-15T11:00:00Z' }
    ],
    calls: [
      { id: 1, duration: 15, notes: 'Initial contact', called_at: '2023-05-16T09:30:00Z' }
    ],
    meetings: [],
    notes: [{ id: 1, content: 'Interested in premium plan', created_at: '2023-05-15T10:35:00Z' }],
    activities: [],
    owner: { id: 1, name: 'Jane Doe' },
    timeline: [],
    campaigns: [{ id: 1, name: 'Summer Promotion' }]
  }
];

// Mock timeline data
const mockTimeline = [
  {
    id: 1,
    type: 'note',
    content: 'Added a note',
    created_at: '2023-05-15T10:35:00Z',
    user: { id: 1, name: 'Jane Doe' }
  },
  {
    id: 2,
    type: 'email',
    content: 'Sent introduction email',
    created_at: '2023-05-15T11:00:00Z',
    user: { id: 1, name: 'Jane Doe' }
  },
  {
    id: 3,
    type: 'call',
    content: 'Made initial contact call (15 min)',
    created_at: '2023-05-16T09:30:00Z',
    user: { id: 1, name: 'Jane Doe' }
  }
];

// Mock insights data
const mockInsights = {
  score_factors: [
    { impact: 1, description: 'Engaged with 3 emails in the past week' },
    { impact: 1, description: 'Visited pricing page multiple times' },
    { impact: -1, description: 'No scheduled meetings yet' }
  ],
  recommendations: [
    'Schedule a product demo call',
    'Send case study for their industry',
    'Follow up within 3 days'
  ],
  conversion_probability: 0.65
};

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
      conversion_probability: 0.55,
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
      conversion_probability: 0.75,
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
      conversion_probability: 0.85,
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
      conversion_probability: 0.55,
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
  
  // Lead endpoints
  'api/v1/leads/1': () => mockLeads[0],
  'api/v1/leads/1/timeline': () => mockTimeline,
  'api/v1/leads/1/insights': () => mockInsights,
  
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