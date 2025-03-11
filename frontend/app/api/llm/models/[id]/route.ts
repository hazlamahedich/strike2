import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Default backend URL if environment variable is not set
const DEFAULT_BACKEND_URL = 'http://localhost:8001';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const id = params.id;
  
  try {
    // Get cookies - properly await them in Next.js 14
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    // Use environment variable with fallback
    const backendUrl = process.env.BACKEND_URL || DEFAULT_BACKEND_URL;
    
    // Make request to backend API
    const response = await fetch(`${backendUrl}/api/llm/models/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionCookie?.value || ''}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP error ${response.status}` }));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch LLM model' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching LLM model:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const id = params.id;
  
  try {
    // Get cookies - properly await them in Next.js 14
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    // Use environment variable with fallback
    const backendUrl = process.env.BACKEND_URL || DEFAULT_BACKEND_URL;
    
    // Get request body
    const body = await request.json();
    
    // Make request to backend API
    const response = await fetch(`${backendUrl}/api/llm/models/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionCookie?.value || ''}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP error ${response.status}` }));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to update LLM model' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating LLM model:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const id = params.id;
  
  try {
    // Get cookies - properly await them in Next.js 14
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    // Use environment variable with fallback
    const backendUrl = process.env.BACKEND_URL || DEFAULT_BACKEND_URL;
    
    // Make request to backend API
    const response = await fetch(`${backendUrl}/api/llm/models/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionCookie?.value || ''}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP error ${response.status}` }));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to delete LLM model' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting LLM model:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 