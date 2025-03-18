import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';

// Define the backend API URL
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`Received GET request for v1/meetings/${id}`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for fetching meeting');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use mock data for development
    const useMockData = getMockDataStatus();
    console.log('Using mock meeting data:', useMockData);

    if (useMockData) {
      // Use mock data
      const mockMeeting = {
        id: id,
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
      };
      
      console.log('Returning mock meeting data for ID:', id);
      return NextResponse.json(mockMeeting);
    } else {
      // Forward the request to the backend API
      const response = await fetch(`${BACKEND_API_URL}/api/meetings/${id}`, {
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
      console.log('Backend API response with meeting data:', data);

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`Received PUT request for updating meeting ${id}`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for updating meeting');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const updateData = await request.json();
    console.log('Meeting update data:', updateData);

    // Use mock data for development
    const useMockData = getMockDataStatus();
    console.log('Using mock data:', useMockData);

    if (useMockData) {
      // Update a mock meeting
      const mockMeeting = {
        id: id,
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      console.log('Returning updated mock meeting:', mockMeeting);
      return NextResponse.json(mockMeeting);
    } else {
      // Forward the request to the backend API
      const response = await fetch(`${BACKEND_API_URL}/api/meetings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { 'Authorization': `Bearer ${session.user?.email}` } : {})
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        console.error(`Backend API error: ${response.status} ${response.statusText}`);
        return NextResponse.json(
          { error: `Backend API error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('Backend API response with updated meeting:', data);

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error updating meeting:', error);
    return NextResponse.json(
      { error: 'Failed to update meeting', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`Received DELETE request for meeting ${id}`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for deleting meeting');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use mock data for development
    const useMockData = getMockDataStatus();
    console.log('Using mock data:', useMockData);

    if (useMockData) {
      // Simulate deleting a meeting
      console.log('Mock deletion of meeting with ID:', id);
      return NextResponse.json({ success: true, message: `Meeting ${id} deleted successfully` });
    } else {
      // Forward the request to the backend API
      const response = await fetch(`${BACKEND_API_URL}/api/meetings/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { 'Authorization': `Bearer ${session.user?.email}` } : {})
        }
      });

      if (!response.ok) {
        console.error(`Backend API error: ${response.status} ${response.statusText}`);
        return NextResponse.json(
          { error: `Backend API error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      return NextResponse.json({ success: true, message: `Meeting ${id} deleted successfully` });
    }
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json(
      { error: 'Failed to delete meeting', details: String(error) },
      { status: 500 }
    );
  }
} 