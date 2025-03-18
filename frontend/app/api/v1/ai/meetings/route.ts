import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Define the backend API URL
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    console.log('Received GET request for v1/ai/meetings');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for AI meetings');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the search params
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const endpoint = queryString 
      ? `${BACKEND_API_URL}/api/v1/ai/meetings?${queryString}` 
      : `${BACKEND_API_URL}/api/v1/ai/meetings`;

    // Forward the request to the backend API
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization if needed
        ...(session ? { 'Authorization': `Bearer ${session.user?.email}` } : {})
      },
    });

    if (!response.ok) {
      console.error(`Backend API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Backend API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend API response with AI meetings data:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in AI meetings GET handler:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Received POST request for v1/ai/meetings');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for AI meetings');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const requestData = await request.json();
    console.log('AI meetings request data:', requestData);

    // Forward the request to the backend API
    const response = await fetch(`${BACKEND_API_URL}/api/v1/ai/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { 'Authorization': `Bearer ${session.user?.email}` } : {})
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      console.error(`Backend API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Backend API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend API response with AI meetings data:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in AI meetings POST handler:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 