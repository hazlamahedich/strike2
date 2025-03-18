import supabase from '../supabase/client';
import { API_CONFIG } from '../config';

/**
 * API response type
 */
export interface ApiResponse<T> {
  data: T;
  error: Error | null;
}

// Store the auth token
let authToken: string | null = null;

/**
 * API client for making requests to the backend
 */
const apiClient = {
  /**
   * Set the authentication token for API requests
   */
  setAuthToken(token: string | null): void {
    authToken = token;
    
    // If token is provided, set the Authorization header for Supabase
    if (token) {
      // For Supabase, the token is automatically handled by the client
      // This is just to store it for potential use in custom fetch calls
      console.log('Auth token set for API client');
    } else {
      console.log('Auth token cleared for API client');
    }
  },
  
  /**
   * Get the current authentication token
   */
  getAuthToken(): string | null {
    return authToken;
  },
  
  /**
   * Make a GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      // Special handling for API routes
      if (endpoint.startsWith('/notifications/') || 
          endpoint.startsWith('/api/') || 
          endpoint.startsWith('/api/v1/') || 
          endpoint.startsWith('api/v1/')) {
        // Use fetch for API routes
        const url = new URL(endpoint, window.location.origin);
        
        // Add query parameters if provided
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              url.searchParams.append(key, String(value));
            }
          });
        }
        
        console.log('Making API GET request to:', url.toString());
        
        try {
          const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for auth
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: `HTTP error ${response.status}` }));
            console.error('API Error Response:', {
              status: response.status,
              statusText: response.statusText,
              data: errorData,
              url: endpoint
            });
            
            let errorMessage = 'An error occurred while fetching data';
            
            // Provide more specific error messages based on status code
            if (response.status === 401) {
              errorMessage = 'You are not authenticated. Please log in again.';
            } else if (response.status === 403) {
              errorMessage = 'You do not have permission to access this resource.';
            } else if (response.status === 404) {
              errorMessage = 'The requested resource was not found.';
            } else if (response.status >= 500) {
              errorMessage = 'A server error occurred. Please try again later.';
            }
            
            throw new Error(
              errorData.detail || 
              errorData.message || 
              errorData.error ||
              `${errorMessage} (${response.status})`
            );
          }
          
          const data = await response.json();
          console.log('API GET response:', data);
          
          return {
            data: data as T,
            error: null
          };
        } catch (fetchError) {
          console.error(`API GET error for ${endpoint}:`, fetchError);
          return {
            data: null as unknown as T,
            error: fetchError instanceof Error ? fetchError : new Error('Unknown error occurred')
          };
        }
      }
      
      // Regular Supabase table handling
      const tableName = endpoint.replace('/api/', '').split('/')[0];
      let query = supabase
        .from(tableName)
        .select('*');
      
      // Apply filters if provided
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        });
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`Supabase error for ${endpoint}:`, error);
      }
      
      return {
        data: data as T,
        error: error
      };
    } catch (error) {
      console.error(`API GET error for ${endpoint}:`, error);
      return {
        data: null as unknown as T,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      // Special handling for API routes
      if (endpoint.startsWith('/api/') || 
          endpoint.startsWith('/notifications/') || 
          endpoint.startsWith('api/v1/')) {
        // Use fetch for API routes
        const url = new URL(endpoint, window.location.origin);
        
        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          credentials: 'include', // Include cookies for auth
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
          data: data as T,
          error: null
        };
      }
      
      // Use Supabase for database requests
      const { data, error } = await supabase
        .from(endpoint.replace('/api/', ''))
        .insert(body)
        .select();
      
      return {
        data: data as T,
        error: error
      };
    } catch (error) {
      console.error(`API POST error for ${endpoint}:`, error);
      return {
        data: null as unknown as T,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      // Ensure endpoint starts with a slash
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      // Special handling for API routes
      if (normalizedEndpoint.startsWith('/api/') || 
          normalizedEndpoint.startsWith('/notifications/') || 
          normalizedEndpoint.startsWith('/api/v1/') ||
          normalizedEndpoint.startsWith('/api/v1/')) {
        // Use fetch for API routes
        const url = new URL(normalizedEndpoint, window.location.origin);
        
        console.log('Making API PUT request to:', url.toString(), 'with body:', body);
        try {
          const response = await fetch(url.toString(), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            credentials: 'include', // Include cookies for auth
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`API error: ${response.status} ${response.statusText}`, errorText);
            return {
              data: null as unknown as T,
              error: new Error(`API error: ${response.status} ${response.statusText}`)
            };
          }
          
          const data = await response.json();
          console.log('API PUT response:', data);
          
          return {
            data: data as T,
            error: null
          };
        } catch (fetchError) {
          console.error('Fetch error in PUT request:', fetchError);
          return {
            data: null as unknown as T,
            error: fetchError instanceof Error ? fetchError : new Error('Unknown fetch error occurred')
          };
        }
      }
      
      // Use Supabase for database requests
      const { data, error } = await supabase
        .from(endpoint.replace('/api/', ''))
        .update(body)
        .eq('id', body.id)
        .select();
      
      return {
        data: data as T,
        error: error
      };
    } catch (error) {
      console.error(`API PUT error for ${endpoint}:`, error);
      return {
        data: null as unknown as T,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string, id?: string | number): Promise<ApiResponse<T>> {
    try {
      const tableName = endpoint.replace('/api/', '');
      
      let query;
      
      if (id) {
        // If ID is provided, delete by ID
        query = supabase.from(tableName).delete().eq('id', id);
      } else {
        // If no ID is provided, use the endpoint as is
        query = supabase.from(tableName).delete();
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`Error deleting from ${endpoint}:`, error);
        return {
          data: null as unknown as T,
          error: new Error(error.message)
        };
      }
      
      return {
        data: data as T,
        error: null
      };
    } catch (error) {
      console.error(`Error in delete request to ${endpoint}:`, error);
      return {
        data: null as unknown as T,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }
};

export default apiClient; 