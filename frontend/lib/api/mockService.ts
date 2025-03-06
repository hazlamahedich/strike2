/**
 * Mock API Service
 * 
 * This file provides mock implementations of API endpoints for development
 * when the backend is not available. It's used as a fallback in the API client.
 */

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