import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Default backend URL if environment variable is not set
const DEFAULT_BACKEND_URL = 'http://localhost:8001';

// Mock data for LLM providers
const mockLlmProviders = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'azure', name: 'Azure OpenAI' },
  { id: 'google', name: 'Google AI' },
  { id: 'cohere', name: 'Cohere' },
  { id: 'huggingface', name: 'Hugging Face' }
];

export async function GET() {
  try {
    // Check if we should use mock data
    const cookieStore = await cookies();
    const useMockData = cookieStore.get('use_mock_data')?.value === 'true';
    
    if (useMockData) {
      console.log('Using mock data for LLM providers');
      return NextResponse.json(mockLlmProviders);
    }
    
    // Get session cookie
    const sessionCookie = cookieStore.get('session');
    
    // Use environment variable with fallback
    const backendUrl = process.env.BACKEND_URL || DEFAULT_BACKEND_URL;
    
    // Make request to backend API
    const response = await fetch(`${backendUrl}/api/llm/providers`, {
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
        console.log('Falling back to mock data for LLM providers due to API error');
        return NextResponse.json(mockLlmProviders);
      }
      
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch LLM providers' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching LLM providers:', error);
    
    // Fallback to mock data on error if enabled globally
    const globalMockEnabled = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    if (globalMockEnabled) {
      console.log('Falling back to mock data for LLM providers due to error');
      return NextResponse.json(mockLlmProviders);
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 