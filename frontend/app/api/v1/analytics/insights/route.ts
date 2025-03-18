'use client';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Define the API headers function since we can't find the import
function getApiHeaders(session: any): Record<string, string> {
  if (!session?.user) {
    return {
      'Content-Type': 'application/json'
    };
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.accessToken || ''}`
  };
}

// Define the backend API URL since we can't find the import
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * GET /api/v1/analytics/insights
 * 
 * Fetch AI-powered analytics insights and recommendations
 */
export async function GET(
  request: NextRequest
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Construct the query string
    let queryParams = new URLSearchParams();
    if (timeRange) {
      queryParams.append('time_range', timeRange);
    }
    if (startDate) {
      queryParams.append('start_date', startDate);
    }
    if (endDate) {
      queryParams.append('end_date', endDate);
    }
    
    // Fetch insights from the backend
    const headers = getApiHeaders(session);
    const response = await fetch(
      `${BACKEND_API_URL}/analytics/insights?${queryParams.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );
    
    if (!response.ok) {
      console.error('Error fetching analytics insights:', await response.text());
      
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch analytics insights' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in analytics insights API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 