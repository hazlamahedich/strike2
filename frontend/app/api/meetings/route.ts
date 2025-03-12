import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MeetingStatus, MeetingType } from '@/lib/types/meeting';
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';

// Define the backend API URL
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function GET(request: NextRequest) {
  try {
    console.log('Received GET request for meetings');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for fetching meetings');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forward the request to the backend API
    const response = await fetch(`${BACKEND_API_URL}/meetings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization if needed
        ...(session ? { 'Authorization': `Bearer ${session.user?.email}` } : {})
      },
    });

    if (!response.ok) {
      console.error(`Backend API error: ${response.status} ${response.statusText}`);
      // Forward the error status and message
      return NextResponse.json(
        { error: `Backend API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend API response:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Received create meeting request');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for creating meeting');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const meetingData = await request.json();
    console.log('Meeting data:', meetingData);

    // Check if we should use mock data
    const useMockData = getMockDataStatus();
    console.log('Using mock data:', useMockData);

    if (useMockData) {
      // Use mock data
      const mockCreatedMeeting = {
        id: Date.now().toString(),
        ...meetingData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        summary: null,
        action_items: [],
        comprehensive_summary: null
      };

      console.log('Returning created mock meeting:', mockCreatedMeeting);
      return NextResponse.json(mockCreatedMeeting, { status: 201 });
    } else {
      // In a production implementation, you would:
      // 1. Validate the meeting data
      // 2. Create the meeting in the database
      // 3. Return the created meeting
      
      // For now, we'll still use mock data but log that we would use real data
      console.log('Would use real data in production');
      
      const mockCreatedMeeting = {
        id: Date.now().toString(),
        ...meetingData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        summary: null,
        action_items: [],
        comprehensive_summary: null
      };

      console.log('Returning created meeting (production mode):', mockCreatedMeeting);
      return NextResponse.json(mockCreatedMeeting, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    );
  }
} 