import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Default backend URL if environment variable is not set
const DEFAULT_BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

// Flag to control whether to use mock data by default
const DEFAULT_USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// Mock data for LLM settings
const mockLlmSettings = {
  defaultModel: {
    id: 1,
    provider: 'openai',
    model_name: 'gpt-4',
    is_default: true,
    max_tokens: 8192,
    temperature: 0.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  usage: {
    totalPromptTokens: 1250000,
    totalCompletionTokens: 850000,
    totalTokens: 2100000,
    totalCost: 42.75
  }
};

export async function GET() {
  try {
    // Check if we should use mock data
    const cookieStore = await cookies();
    
    // The cookie can override the default setting (useful for testing)
    let useMockData = DEFAULT_USE_MOCK;
    const mockCookie = cookieStore.get('use_mock_data');
    if (mockCookie) {
      useMockData = mockCookie.value === 'true';
    }
    
    if (useMockData) {
      console.log('[LLM Settings API] Using mock data');
      return NextResponse.json(mockLlmSettings);
    }
    
    // Prepare for real API call
    console.log(`[LLM Settings API] Using backend URL: ${DEFAULT_BACKEND_URL}`);
    
    // Get session cookie for authentication
    const sessionCookie = cookieStore.get('session');
    const authHeader = sessionCookie ? `Bearer ${sessionCookie.value}` : '';
    
    // Make request to backend API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(`${DEFAULT_BACKEND_URL}/api/llm/settings`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        signal: controller.signal
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      // Handle non-successful responses
      if (!response.ok) {
        let errorDetail;
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorData.error || `HTTP error ${response.status}`;
        } catch (parseError) {
          errorDetail = `HTTP error ${response.status} (failed to parse error details)`;
        }
        
        console.error(`[LLM Settings API] Error from backend: ${errorDetail}`);
        
        // Fallback to mock data on error if enabled globally
        if (DEFAULT_USE_MOCK) {
          console.log('[LLM Settings API] Falling back to mock data due to API error');
          return NextResponse.json(mockLlmSettings);
        }
        
        return NextResponse.json(
          { error: errorDetail || 'Failed to fetch LLM settings' },
          { status: response.status }
        );
      }
      
      // Parse successful response
      const data = await response.json();
      console.log('[LLM Settings API] Successfully retrieved data from backend');
      return NextResponse.json(data);
    } catch (fetchError) {
      // Clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);
      
      // Handle fetch errors (network issues, timeouts, etc.)
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
      console.error(`[LLM Settings API] Fetch error: ${errorMessage}`);
      
      // Fallback to mock data on fetch error if enabled globally
      if (DEFAULT_USE_MOCK) {
        console.log('[LLM Settings API] Falling back to mock data due to fetch error');
        return NextResponse.json(mockLlmSettings);
      }
      
      throw fetchError; // Re-throw to be caught by outer try/catch
    }
  } catch (error) {
    // Handle any uncaught errors in the process
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[LLM Settings API] Uncaught error: ${errorMessage}`);
    console.error(error instanceof Error ? error.stack : 'No stack trace available');
    
    // Final fallback to mock data
    if (DEFAULT_USE_MOCK) {
      console.log('[LLM Settings API] Final fallback to mock data due to uncaught error');
      return NextResponse.json(mockLlmSettings);
    }
    
    // If not using mock data, return error
    return NextResponse.json(
      { 
        error: 'Internal server error',
        detail: errorMessage,
        // Include stack trace in development only
        ...(process.env.NODE_ENV === 'development' ? { 
          stack: error instanceof Error ? error.stack : undefined 
        } : {})
      },
      { status: 500 }
    );
  }
} 