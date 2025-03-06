type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
};

// Import Supabase client
import supabase from '../supabase/client';
import mockService from './mockService';

// Base API URL from environment variable (with fallback)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create a reusable client for API requests
class ApiClient {
  private authToken: string | null = null;

  // Method to set auth token (called after login)
  setAuthToken(token: string) {
    this.authToken = token;
    // If in browser, store token in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  // Method to get auth token (checks localStorage if in browser)
  getAuthToken(): string | null {
    if (this.authToken) return this.authToken;
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        this.authToken = token;
        return token;
      }
    }
    
    return null;
  }

  // Method to clear auth token (called after logout)
  clearAuthToken() {
    this.authToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Method to get the current session from Supabase
  async getSupabaseSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Failed to get Supabase session:', error);
      return null;
    }
  }

  // Method to refresh the Supabase token
  async refreshSupabaseToken() {
    try {
      const { data: { session } } = await supabase.auth.refreshSession();
      if (session?.access_token) {
        this.setAuthToken(session.access_token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to refresh Supabase token:', error);
      return false;
    }
  }

  // Generic fetch method with authentication and error handling
  async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    // Check if we should use mock data
    if (mockService.shouldUseMockData()) {
      try {
        console.log(`Using mock data for endpoint: ${endpoint}`);
        return mockService.getMockData(endpoint) as T;
      } catch (error) {
        console.warn(`Mock service error for ${endpoint}:`, error);
        // Continue with real API call as fallback
      }
    }
    
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    // Default headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Try to get token from stored token first
    let token = this.getAuthToken();
    
    // If no stored token, try to get from Supabase session
    if (!token) {
      try {
        const session = await this.getSupabaseSession();
        if (session?.access_token) {
          token = session.access_token;
          this.setAuthToken(token);
        }
      } catch (error) {
        console.warn('Failed to get Supabase session:', error);
        // Continue without token
      }
    }
    
    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Prepare request options
    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
      credentials: options.credentials || 'include',
      // Add a timeout using AbortController
      signal: AbortSignal.timeout(10000), // 10 second timeout
    };
    
    // Add body for non-GET requests if provided
    if (options.body && fetchOptions.method !== 'GET') {
      // If the body is FormData, use it directly without stringifying
      if (options.body instanceof FormData) {
        fetchOptions.body = options.body;
        // Remove Content-Type to let the browser set it with the boundary
        if (fetchOptions.headers && 'Content-Type' in fetchOptions.headers) {
          delete fetchOptions.headers['Content-Type'];
        }
      } else {
        fetchOptions.body = JSON.stringify(options.body);
      }
    }
    
    try {
      const response = await fetch(url, fetchOptions);
      
      // Handle 401 Unauthorized (token expired or invalid)
      if (response.status === 401) {
        console.log('Received 401 unauthorized, attempting to refresh token');
        
        // Try to refresh the token
        const refreshed = await this.refreshSupabaseToken();
        
        if (refreshed) {
          console.log('Token refreshed successfully, retrying request');
          // Retry the request with the new token
          return this.fetch<T>(endpoint, options);
        }
        
        // If refresh failed, clear auth and redirect to login
        this.clearAuthToken();
        
        // Sign out from Supabase as well
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.warn('Failed to sign out from Supabase:', error);
        }
        
        // Redirect to login in browser environment
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        throw new Error('Authentication required');
      }
      
      // Parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Failed to parse JSON response:', error);
        throw new Error('Invalid response from server');
      }
      
      // Handle API errors
      if (!response.ok) {
        // Use the error message from the API if available
        throw new Error(data.detail || data.message || 'API request failed');
      }
      
      return data as T;
    } catch (error) {
      // Check if it's an AbortError (timeout)
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error('API request timed out:', url);
        throw new Error('Request timed out. The server might be unavailable.');
      }
      
      console.error('API request failed:', error);
      throw error;
    }
  }
  
  // Convenience methods for different HTTP verbs
  async get<T>(endpoint: string, options: Omit<FetchOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'GET' });
  }
  
  async post<T>(endpoint: string, body: any, options: Omit<FetchOptions, 'method'> = {}): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'POST', body });
  }
  
  async put<T>(endpoint: string, body: any, options: Omit<FetchOptions, 'method'> = {}): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'PUT', body });
  }
  
  async patch<T>(endpoint: string, body: any, options: Omit<FetchOptions, 'method'> = {}): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'PATCH', body });
  }
  
  async delete<T>(endpoint: string, options: Omit<FetchOptions, 'method'> = {}): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();

// Initialize auth token from localStorage if in browser
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('auth_token');
  if (token) {
    apiClient.setAuthToken(token);
  }
}

export default apiClient; 