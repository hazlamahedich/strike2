import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Default backend URL if environment variable is not set
const DEFAULT_BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

// Flag to control whether to use mock data by default
const DEFAULT_USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// Mock data for LLM generation
const generateMockResponse = (prompt: string, options: any = {}) => {
  // Generate a more realistic mock response based on the prompt
  let responseText = '';
  
  if (prompt.toLowerCase().includes('summarize')) {
    responseText = `Summary: ${prompt.slice(0, 30)}...`;
  } else if (prompt.toLowerCase().includes('question')) {
    responseText = `Answer: Based on the information provided, the answer is...`;
  } else if (prompt.toLowerCase().includes('analyze')) {
    responseText = `Analysis: Upon analyzing the provided data, we can conclude that...`;
  } else {
    responseText = `Here is a response to your prompt: "${prompt.slice(0, 50)}..."`;
  }
  
  // Add some variety based on temperature if provided
  const temperature = options.temperature || 0.5;
  if (temperature > 0.7) {
    responseText += " This response was generated with higher creativity.";
  } else if (temperature < 0.3) {
    responseText += " This response was generated with high precision.";
  }
  
  // Calculate token usage
  const promptTokens = Math.ceil(prompt.length / 4);
  const completionTokens = Math.ceil(responseText.length / 4);
  
  return {
    text: responseText,
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    }
  };
};

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    
    // Check if we should use mock data
    const cookieStore = await cookies();
    
    // The cookie can override the default setting (useful for testing)
    let useMockData = DEFAULT_USE_MOCK;
    const mockCookie = cookieStore.get('use_mock_data');
    if (mockCookie) {
      useMockData = mockCookie.value === 'true';
    }
    
    if (useMockData) {
      console.log('[LLM Generate API] Using mock data for generation');
      return NextResponse.json(generateMockResponse(body.prompt, {
        temperature: body.temperature,
        max_tokens: body.max_tokens
      }));
    }
    
    // Get session cookie for authentication
    const sessionCookie = cookieStore.get('session');
    const authHeader = sessionCookie ? `Bearer ${sessionCookie.value}` : '';
    
    // Make request to backend API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      // Check if the backend API has a generate endpoint yet
      // If not, we'll need to add a fallback for now
      
      // First, check if the server is running
      const healthResponse = await fetch(`${DEFAULT_BACKEND_URL}/api/health`, {
        signal: AbortSignal.timeout(3000) // Quick timeout just for health check
      }).catch(() => null);
      
      // If server is not running or doesn't have generate endpoint yet, use mock data
      if (!healthResponse?.ok) {
        console.warn('[LLM Generate API] Backend server not responding, using mock data');
        clearTimeout(timeoutId);
        return NextResponse.json(generateMockResponse(body.prompt, {
          temperature: body.temperature,
          max_tokens: body.max_tokens
        }));
      }
      
      // Now try to use the actual generate endpoint
      const response = await fetch(`${DEFAULT_BACKEND_URL}/api/llm/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      // If the endpoint doesn't exist yet, use mock data
      if (response.status === 404) {
        console.warn('[LLM Generate API] Backend generate endpoint not implemented yet, using mock data');
        return NextResponse.json(generateMockResponse(body.prompt, {
          temperature: body.temperature,
          max_tokens: body.max_tokens
        }));
      }
      
      // Handle other non-successful responses
      if (!response.ok) {
        let errorDetail;
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorData.error || `HTTP error ${response.status}`;
        } catch (parseError) {
          errorDetail = `HTTP error ${response.status} (failed to parse error details)`;
        }
        
        console.error(`[LLM Generate API] Error from backend: ${errorDetail}`);
        
        // Fallback to mock data on error if enabled globally
        if (DEFAULT_USE_MOCK) {
          console.log('[LLM Generate API] Falling back to mock data due to API error');
          return NextResponse.json(generateMockResponse(body.prompt, {
            temperature: body.temperature,
            max_tokens: body.max_tokens
          }));
        }
        
        return NextResponse.json(
          { error: errorDetail || 'Failed to generate text' },
          { status: response.status }
        );
      }
      
      // Parse successful response
      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      // Clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);
      
      // Handle fetch errors (network issues, timeouts, etc.)
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
      console.error(`[LLM Generate API] Fetch error: ${errorMessage}`);
      
      // Fallback to mock data on fetch error if enabled globally or if it's an AbortError (timeout)
      if (DEFAULT_USE_MOCK || fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        console.log('[LLM Generate API] Falling back to mock data due to fetch error or timeout');
        return NextResponse.json(generateMockResponse(body.prompt, {
          temperature: body.temperature,
          max_tokens: body.max_tokens
        }));
      }
      
      throw fetchError; // Re-throw to be caught by outer try/catch
    }
  } catch (error) {
    // Handle any uncaught errors in the process
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[LLM Generate API] Uncaught error: ${errorMessage}`);
    console.error(error instanceof Error ? error.stack : 'No stack trace available');
    
    // Final fallback to mock data
    if (DEFAULT_USE_MOCK) {
      console.log('[LLM Generate API] Final fallback to mock data due to uncaught error');
      try {
        const body = await request.json().catch(() => ({ prompt: "Error occurred" }));
        return NextResponse.json(generateMockResponse(body.prompt, {
          temperature: body.temperature,
          max_tokens: body.max_tokens
        }));
      } catch (parseError) {
        return NextResponse.json(generateMockResponse("Error occurred", {}));
      }
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