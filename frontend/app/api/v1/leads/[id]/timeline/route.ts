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
  console.log('⭐⭐⭐ TIMELINE ROUTE - Request received:', request.url);
  console.log('⭐⭐⭐ TIMELINE ROUTE - Params:', params);
  
  try {
    // Convert id to string to ensure compatibility
    const id = params.id;
    console.log(`⭐⭐⭐ TIMELINE ROUTE - Received GET request for v1/leads/${id}/timeline`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('⭐⭐⭐ TIMELINE ROUTE - Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('⭐⭐⭐ TIMELINE ROUTE - Unauthorized request for fetching lead timeline');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use mock data for development
    const useMockData = getMockDataStatus();
    console.log('⭐⭐⭐ TIMELINE ROUTE - Using mock lead timeline data:', useMockData);

    if (useMockData) {
      // Use mock data
      const mockTimeline = [
        {
          id: "1",
          lead_id: id,
          activity_type: "EMAIL",
          activity_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Initial outreach email sent",
          user_id: "1",
          user_name: "John Smith",
          metadata: {
            email_subject: "Introduction to our services",
            email_opened: true,
            email_clicked: true
          }
        },
        {
          id: "2",
          lead_id: id,
          activity_type: "CALL",
          activity_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Discovery call completed",
          user_id: "1",
          user_name: "John Smith",
          metadata: {
            call_duration: "25min",
            call_outcome: "Positive"
          }
        },
        {
          id: "3",
          lead_id: id,
          activity_type: "MEETING",
          activity_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Product demo meeting",
          user_id: "2",
          user_name: "Jane Doe",
          metadata: {
            meeting_duration: "45min",
            meeting_outcome: "Follow-up required"
          }
        },
        {
          id: "4",
          lead_id: id,
          activity_type: "NOTE",
          activity_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Client interested in enterprise plan. Needs pricing information.",
          user_id: "1",
          user_name: "John Smith",
          metadata: {}
        }
      ];
      
      console.log('⭐⭐⭐ TIMELINE ROUTE - Returning mock lead timeline data for ID:', id);
      return NextResponse.json(mockTimeline);
    } else {
      // Forward the request to the backend API
      console.log(`⭐⭐⭐ TIMELINE ROUTE - Forwarding request to backend: ${BACKEND_API_URL}/api/leads/${id}/timeline`);
      
      const response = await fetch(`${BACKEND_API_URL}/api/leads/${id}/timeline`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Forward authorization if needed
          ...(session ? { 'Authorization': `Bearer ${session.user?.email}` } : {})
        },
      });

      if (!response.ok) {
        console.error(`⭐⭐⭐ TIMELINE ROUTE - Backend API error: ${response.status} ${response.statusText}`);
        return NextResponse.json(
          { error: `Backend API error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('⭐⭐⭐ TIMELINE ROUTE - Backend API response with lead timeline data:', data);

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('⭐⭐⭐ TIMELINE ROUTE - Error fetching lead timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead timeline', details: String(error) },
      { status: 500 }
    );
  }
} 