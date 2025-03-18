import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Default backend URL if environment variable is not set
const DEFAULT_BACKEND_URL = 'http://localhost:8001';

// Mock data for LLM models
const mockLlmModels = [
  {
    id: 1,
    provider: 'openai',
    model_name: 'gpt-4',
    is_default: true,
    max_tokens: 8192,
    temperature: 0.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    provider: 'openai',
    model_name: 'gpt-3.5-turbo',
    is_default: false,
    max_tokens: 4096,
    temperature: 0.7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    provider: 'anthropic',
    model_name: 'claude-3-opus',
    is_default: false,
    max_tokens: 100000,
    temperature: 0.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function GET() {
  try {
    // Check if we should use mock data
    const cookieStore = await cookies();
    const useMockData = cookieStore.get('use_mock_data')?.value === 'true';
    
    if (useMockData) {
      console.log('Using mock data for LLM models');
      return NextResponse.json(mockLlmModels);
    }
    
    // Get session cookie
    const sessionCookie = cookieStore.get('session');
    
    // Use environment variable with fallback
    const backendUrl = process.env.BACKEND_URL || DEFAULT_BACKEND_URL;
    
    // Make request to backend API
    const response = await fetch(`${backendUrl}/api/llm/models`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionCookie?.value || ''}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP error ${response.status}` }));
      
      // Fallback to mock data on error if enabled globally
      const globalMockEnabled = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
      if (globalMockEnabled) {
        console.log('Falling back to mock data for LLM models due to API error');
        return NextResponse.json(mockLlmModels);
      }
      
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch LLM models' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching LLM models:', error);
    
    // Fallback to mock data on error if enabled globally
    const globalMockEnabled = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (globalMockEnabled) {
      console.log('Falling back to mock data for LLM models due to error');
      return NextResponse.json(mockLlmModels);
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if we should use mock data
    const cookieStore = await cookies();
    const useMockData = cookieStore.get('use_mock_data')?.value === 'true';
    
    if (useMockData) {
      // Return success response with mock data
      console.log('Using mock data for LLM model creation');
      const body = await request.json();
      const newModel = {
        id: mockLlmModels.length + 1,
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return NextResponse.json(newModel);
    }
    
    // Get session cookie
    const sessionCookie = cookieStore.get('session');
    
    // Use environment variable with fallback
    const backendUrl = process.env.BACKEND_URL || DEFAULT_BACKEND_URL;
    
    // Get request body
    const body = await request.json();
    
    // Make request to backend API
    const response = await fetch(`${backendUrl}/api/llm/models`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionCookie?.value || ''}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP error ${response.status}` }));
      
      // Fallback to mock data on error if enabled globally
      const globalMockEnabled = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
      if (globalMockEnabled) {
        console.log('Falling back to mock data for LLM model creation due to API error');
        const newModel = {
          id: mockLlmModels.length + 1,
          ...body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return NextResponse.json(newModel);
      }
      
      return NextResponse.json(
        { error: errorData.detail || 'Failed to create LLM model' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating LLM model:', error);
    
    // Fallback to mock data on error if enabled globally
    const globalMockEnabled = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (globalMockEnabled && request.body) {
      try {
        console.log('Falling back to mock data for LLM model creation due to error');
        const body = await request.json();
        const newModel = {
          id: mockLlmModels.length + 1,
          ...body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return NextResponse.json(newModel);
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 