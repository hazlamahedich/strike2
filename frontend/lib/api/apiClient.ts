import axios, { AxiosError, AxiosResponse } from 'axios';

// Base API client configuration
export const apiClient = axios.create({
  baseURL: '', // Remove the '/api' prefix to avoid duplication
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // Increased to 20 seconds timeout
});

// Error interface
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// Response interface
export interface ApiResponse<T> {
  data: T;
  error: ApiError | null;
}

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage, but handle potential errors
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Error accessing localStorage for auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Success [${response.config.method?.toUpperCase()}] ${response.config.url}:`, { 
        status: response.status,
        data: response.data 
      });
    }
    return response;
  },
  (error) => {
    // Log detailed error information for debugging
    if (error.response) {
      // Detailed response error logging with request context
      const requestDetails = {
        method: error.config?.method?.toUpperCase() || 'UNKNOWN',
        url: error.config?.url || 'Unknown URL',
        baseURL: error.config?.baseURL || 'Unknown baseURL',
        fullURL: error.config?.baseURL && error.config?.url ? 
          `${error.config.baseURL}${error.config.url}` : 'Unknown full URL',
        headers: error.config?.headers || {},
        data: error.config?.data ? JSON.parse(error.config.data) : 'No request data',
      };
      
      console.error(`API Error [${requestDetails.method}] ${requestDetails.url}:`, {
        request: requestDetails,
        response: {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data || 'Empty response body',
        }
      });
      
      // Handle empty error response
      if (error.response.status === 401 && (!error.response.data || Object.keys(error.response.data).length === 0)) {
        console.error('Authentication error: Empty error response with 401 status');
        error.isAuthError = true;
        error.message = 'Authentication required. Please log in again.';
      } else if (error.response.status === 404) {
        console.error(`Resource not found error: ${requestDetails.fullURL}`);
        error.isNotFoundError = true;
        error.message = 'The requested resource was not found.';
      } else if (!error.response.data || Object.keys(error.response.data).length === 0) {
        console.error(`Empty error response with status: ${error.response.status}`);
        error.message = `API Error: ${error.response.status} ${error.response.statusText}`;
      }
    } else if (error.request) {
      console.error('API Error Request:', {
        message: error.message,
        code: error.code,
        url: error.config?.url || 'Unknown URL',
        baseURL: error.config?.baseURL || 'Unknown baseURL',
      });
    } else {
      console.error('API Error Setup:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle Axios errors
const handleAxiosError = <T>(error: AxiosError): ApiResponse<T> => {
  let apiError: ApiError = {
    message: 'An unexpected error occurred',
  };

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const data = error.response.data as any;
    
    // Handle empty error response
    if (error.response.status === 401 && (!data || Object.keys(data).length === 0)) {
      apiError = {
        message: 'Authentication required. Please log in again.',
        code: 'AUTH_REQUIRED',
        status: 401,
        details: { isAuthError: true },
      };
    } else {
      apiError = {
        message: data.message || `Server error: ${error.response.status} ${error.response.statusText}`,
        code: data.code || `HTTP_${error.response.status}`,
        status: error.response.status,
        details: data.details || data,
      };
    }
    
    // Handle specific HTTP status codes
    if (error.response.status === 401) {
      apiError.message = 'Authentication required. Please log in again.';
      apiError.code = 'AUTH_REQUIRED';
      
      // Optionally trigger a logout or redirect to login
      if (typeof window !== 'undefined') {
        // Only attempt to clear localStorage in browser environment
        try {
          localStorage.removeItem('auth_token');
        } catch (e) {
          console.warn('Failed to clear auth token:', e);
        }
      }
    } else if (error.response.status === 403) {
      apiError.message = 'You do not have permission to access this resource.';
      apiError.code = 'FORBIDDEN';
    } else if (error.response.status === 404) {
      apiError.message = 'The requested resource was not found.';
      apiError.code = 'NOT_FOUND';
    } else if (error.response.status >= 500) {
      apiError.message = 'Server error. Please try again later.';
      apiError.code = 'SERVER_ERROR';
    }
  } else if (error.request) {
    // The request was made but no response was received
    if (error.code === 'ECONNABORTED') {
      apiError = {
        message: 'Request timed out. The server is taking too long to respond. Please try again later.',
        code: 'TIMEOUT_ERROR',
        details: {
          timeout: error.config?.timeout,
          url: error.config?.url,
        },
      };
    } else {
      apiError = {
        message: 'No response from server. Please check your network connection.',
        code: 'NETWORK_ERROR',
        details: {
          errorCode: error.code,
          url: error.config?.url,
        },
      };
    }
  } else {
    // Something happened in setting up the request that triggered an Error
    apiError = {
      message: error.message || 'Request failed',
      code: 'REQUEST_ERROR',
      details: {
        name: error.name,
        stack: error.stack,
      },
    };
  }

  return {
    data: null as any,
    error: apiError,
  };
};

// Generic GET request
const get = async <T>(url: string, params?: any): Promise<ApiResponse<T>> => {
  try {
    // NextAuth handles authentication through cookies, not localStorage
    // So we don't need to check for auth_token here
    
    const response = await apiClient.get<T>(url, { params });
    return {
      data: response.data,
      error: null,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return handleAxiosError<T>(error);
    }
    return {
      data: null as any,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
        details: error,
      },
    };
  }
};

// Generic POST request
const post = async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
  try {
    // NextAuth handles authentication through cookies, not localStorage
    
    const response = await apiClient.post<T>(url, data);
    return {
      data: response.data,
      error: null,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return handleAxiosError<T>(error);
    }
    return {
      data: null as any,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
        details: error,
      },
    };
  }
};

// Generic PUT request
const put = async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
  try {
    // NextAuth handles authentication through cookies, not localStorage
    
    const response = await apiClient.put<T>(url, data);
    return {
      data: response.data,
      error: null,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return handleAxiosError<T>(error);
    }
    return {
      data: null as any,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
        details: error,
      },
    };
  }
};

// Generic DELETE request
const del = async <T>(url: string): Promise<ApiResponse<T>> => {
  try {
    // NextAuth handles authentication through cookies, not localStorage
    
    const response = await apiClient.delete<T>(url);
    return {
      data: response.data,
      error: null,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return handleAxiosError<T>(error);
    }
    return {
      data: null as any,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
        details: error,
      },
    };
  }
};

export { get, post, put, del }; 