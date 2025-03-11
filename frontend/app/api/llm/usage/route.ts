import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Default backend URL if environment variable is not set
const DEFAULT_BACKEND_URL = 'http://localhost:8001';

export async function GET(request: NextRequest) {
  try {
    // Get cookies - properly await them in Next.js 14
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const groupBy = searchParams.get('group_by');
    const period = searchParams.get('period');
    
    // Use environment variable with fallback
    const backendUrl = process.env.BACKEND_URL || DEFAULT_BACKEND_URL;
    console.log(`Using backend URL: ${backendUrl}`);
    
    // Construct URL with query parameters
    let url = `${backendUrl}/api/llm/usage`;
    const queryParams = new URLSearchParams();
    
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (groupBy) queryParams.append('group_by', groupBy);
    if (period) queryParams.append('period', period);
    
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    console.log(`Fetching LLM usage data from: ${url}`);
    
    // Make request to backend API
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionCookie?.value || ''}`,
      },
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorDetail = '';
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.error || `HTTP error ${response.status}`;
      } catch (e) {
        errorDetail = `HTTP error ${response.status}`;
      }
      
      console.error('Error response from LLM usage API:', response.status, errorDetail);
      
      // For 403 errors (unauthorized), return a more specific message
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'You do not have permission to access LLM usage data' },
          { status: 403 }
        );
      }
      
      // For 404 errors (not found), return a specific message
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'No usage data found for the specified period' },
          { status: 404 }
        );
      }
      
      // For 500 errors (server error), return a specific message
      if (response.status === 500) {
        return NextResponse.json(
          { error: 'Server error occurred while fetching LLM usage data', detail: errorDetail },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch LLM usage data', detail: errorDetail },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching LLM usage data:', error);
    
    // Return a more detailed error message
    const errorMessage = error instanceof Error 
      ? `${error.name}: ${error.message}` 
      : 'Unknown error';
      
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        detail: errorMessage,
        // For development, include the full error
        ...(process.env.NODE_ENV === 'development' ? { stack: error instanceof Error ? error.stack : undefined } : {})
      },
      { status: 500 }
    );
  }
} 