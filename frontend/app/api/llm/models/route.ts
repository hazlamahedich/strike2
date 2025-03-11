import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Default backend URL if environment variable is not set
const DEFAULT_BACKEND_URL = 'http://localhost:8001';

export async function GET() {
  try {
    // Get cookies - properly await them in Next.js 14
    const cookieStore = await cookies();
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
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch LLM models' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching LLM models:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get cookies - properly await them in Next.js 14
    const cookieStore = await cookies();
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
      return NextResponse.json(
        { error: errorData.detail || 'Failed to create LLM model' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating LLM model:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 