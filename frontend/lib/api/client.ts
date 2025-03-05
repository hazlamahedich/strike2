type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
};

// Base API URL from environment variable (with fallback)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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

  // Generic fetch method with authentication and error handling
  async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    // Default headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Prepare request options
    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
      credentials: options.credentials || 'include',
    };
    
    // Add body for non-GET requests if provided
    if (options.body && fetchOptions.method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
    }
    
    try {
      const response = await fetch(url, fetchOptions);
      
      // Handle 401 Unauthorized (token expired or invalid)
      if (response.status === 401) {
        this.clearAuthToken();
        // Redirect to login in browser environment
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        throw new Error('Authentication required');
      }
      
      // Parse JSON response
      const data = await response.json();
      
      // Handle API errors
      if (!response.ok) {
        // Use the error message from the API if available
        throw new Error(data.detail || data.message || 'API request failed');
      }
      
      return data as T;
    } catch (error) {
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