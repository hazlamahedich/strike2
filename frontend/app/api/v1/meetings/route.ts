import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';

// Define the backend API URL
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    console.log('Received GET request for v1/meetings');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for fetching meetings');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use mock data for development
    const useMockData = getMockDataStatus();
    console.log('Using mock meeting data:', useMockData);

    if (useMockData) {
      // Use mock data
      const mockMeetings = [
        {
          id: "101",
          title: "Initial Discovery Call",
          description: "Discuss company needs and potential solutions",
          start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          end_time: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 1 hour
          status: "SCHEDULED",
          location: "Zoom",
          meeting_type: "INITIAL_CALL",
          lead_id: "1",
          organizer: {
            id: "1",
            name: "John Smith",
            email: "john@example.com"
          },
          attendees: [
            {
              name: "Jane Doe",
              email: "jane@example.com",
              status: "CONFIRMED"
            }
          ],
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "102",
          title: "Product Demo",
          description: "Demonstrate our enterprise solution",
          start_time: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
          end_time: new Date(Date.now() + 176400000).toISOString(), // Day after tomorrow + 1 hour
          status: "SCHEDULED",
          location: "Microsoft Teams",
          meeting_type: "DEMO",
          lead_id: "2",
          organizer: {
            id: "1",
            name: "John Smith",
            email: "john@example.com"
          },
          attendees: [
            {
              name: "Bob Johnson",
              email: "bob@example.com",
              status: "CONFIRMED"
            },
            {
              name: "Alice Williams",
              email: "alice@example.com",
              status: "PENDING"
            }
          ],
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      console.log('Returning mock meetings data');
      return NextResponse.json(mockMeetings);
    } else {
      // Forward the request to the backend API
      const response = await fetch(`${BACKEND_API_URL}/api/meetings`, {
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
      console.log('Backend API response with meetings data:', data);

      return NextResponse.json(data);
    }
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
    console.log('Received POST request for creating meeting');
    
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

    // Use mock data for development
    const useMockData = getMockDataStatus();
    console.log('Using mock data:', useMockData);

    if (useMockData) {
      // Create a mock meeting with an ID
      const mockMeeting = {
        id: Date.now().toString(),
        ...meetingData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organizer: {
          id: "1",
          name: "John Smith",
          email: "john@example.com"
        }
      };
      
      console.log('Returning created mock meeting:', mockMeeting);
      return NextResponse.json(mockMeeting, { status: 201 });
    } else {
      // Forward the request to the backend API
      const response = await fetch(`${BACKEND_API_URL}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { 'Authorization': `Bearer ${session.user?.email}` } : {})
        },
        body: JSON.stringify(meetingData)
      });

      if (!response.ok) {
        console.error(`Backend API error: ${response.status} ${response.statusText}`);
        return NextResponse.json(
          { error: `Backend API error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('Backend API response with created meeting:', data);

      return NextResponse.json(data, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting', details: String(error) },
      { status: 500 }
    );
  }
} 