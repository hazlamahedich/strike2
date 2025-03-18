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
    // Convert id to string to ensure compatibility
    const id = params.id;
    console.log(`Received GET request for v1/leads/${id}/notes`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for fetching lead notes');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use mock data for development
    const useMockData = getMockDataStatus();
    console.log('Using mock lead notes data:', useMockData);

    if (useMockData) {
      // Use mock data
      const mockNotes = [
        {
          id: "1",
          lead_id: id,
          content: "Initial contact made. Lead is interested in our enterprise solution.",
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: "1",
          created_by_name: "John Smith"
        },
        {
          id: "2",
          lead_id: id,
          content: "Discussed pricing options. They're comparing us with Competitor X.",
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: "2",
          created_by_name: "Jane Doe"
        },
        {
          id: "3",
          lead_id: id,
          content: "Follow-up call scheduled for next week. Need to prepare demo materials.",
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: "1",
          created_by_name: "John Smith"
        }
      ];
      
      console.log('Returning mock lead notes data for ID:', id);
      return NextResponse.json(mockNotes);
    } else {
      // Forward the request to the backend API
      const response = await fetch(`${BACKEND_API_URL}/api/leads/${id}/notes`, {
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
      console.log('Backend API response with lead notes data:', data);

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error fetching lead notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead notes', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`Received POST request for v1/leads/${id}/notes`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for adding lead note');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const requestData = await request.json();
    console.log('Lead note data:', requestData);

    // Use mock data for development
    const useMockData = getMockDataStatus();
    console.log('Using mock data:', useMockData);

    if (useMockData) {
      // Create a mock note
      const mockNote = {
        id: Math.floor(Math.random() * 10000).toString(),
        lead_id: id,
        content: requestData.content,
        created_at: new Date().toISOString(),
        created_by: session.user?.id || "1",
        created_by_name: session.user?.name || "John Smith"
      };
      
      console.log('Returning created mock note:', mockNote);
      return NextResponse.json(mockNote);
    } else {
      // Forward the request to the backend API
      const response = await fetch(`${BACKEND_API_URL}/api/leads/${id}/notes`, {
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
      console.log('Backend API response with created note:', data);

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error creating lead note:', error);
    return NextResponse.json(
      { error: 'Failed to create lead note', details: String(error) },
      { status: 500 }
    );
  }
} 