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
  console.log('⭐⭐⭐ INSIGHTS ROUTE - Request received:', request.url);
  console.log('⭐⭐⭐ INSIGHTS ROUTE - Params:', params);
  
  try {
    // Convert id to string to ensure compatibility
    const id = params.id;
    console.log(`⭐⭐⭐ INSIGHTS ROUTE - Received GET request for v1/leads/${id}/insights`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('⭐⭐⭐ INSIGHTS ROUTE - Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('⭐⭐⭐ INSIGHTS ROUTE - Unauthorized request for fetching lead insights');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use mock data for development
    const useMockData = getMockDataStatus();
    console.log('⭐⭐⭐ INSIGHTS ROUTE - Using mock lead insights data:', useMockData);

    if (useMockData) {
      // Use mock data
      const mockInsights = {
        lead_id: id,
        engagement_score: 75,
        last_activity_date: new Date().toISOString(),
        email_open_rate: 65,
        click_rate: 28,
        response_time_avg: "4h",
        website_visits: 12,
        recent_interests: ["pricing", "enterprise features", "support plans"],
        recommended_actions: [
          {
            action: "Send follow-up email",
            priority: "High",
            reason: "High engagement but no recent response"
          },
          {
            action: "Schedule demo",
            priority: "Medium",
            reason: "Showed interest in enterprise features"
          }
        ]
      };
      
      console.log('⭐⭐⭐ INSIGHTS ROUTE - Returning mock lead insights data for ID:', id);
      return NextResponse.json(mockInsights);
    } else {
      // Forward the request to the backend API
      console.log(`⭐⭐⭐ INSIGHTS ROUTE - Forwarding request to backend: ${BACKEND_API_URL}/api/leads/${id}/insights`);
      
      const response = await fetch(`${BACKEND_API_URL}/api/leads/${id}/insights`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Forward authorization if needed
          ...(session ? { 'Authorization': `Bearer ${session.user?.email}` } : {})
        },
      });

      if (!response.ok) {
        console.error(`⭐⭐⭐ INSIGHTS ROUTE - Backend API error: ${response.status} ${response.statusText}`);
        return NextResponse.json(
          { error: `Backend API error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('⭐⭐⭐ INSIGHTS ROUTE - Backend API response with lead insights data:', data);

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('⭐⭐⭐ INSIGHTS ROUTE - Error fetching lead insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead insights', details: String(error) },
      { status: 500 }
    );
  }
} 