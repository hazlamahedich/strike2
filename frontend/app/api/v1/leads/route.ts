import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';

// Define the backend API URL
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    console.log('Received GET request for v1/leads');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for fetching leads');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use mock data for development
    const useMockData = getMockDataStatus();
    console.log('Using mock lead data:', useMockData);

    if (useMockData) {
      // Use mock data
      const mockLeads = [
        {
          id: "1",
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          phone: "+1234567890",
          company: "Acme Inc",
          title: "CEO",
          status: "NEW",
          source: "WEBSITE",
          notes: "Interested in our enterprise plan",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString(),
          lead_score: 85,
          owner_id: "1"
        },
        {
          id: "2",
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
          phone: "+1987654321",
          company: "XYZ Corp",
          title: "CTO",
          status: "CONTACTED",
          source: "REFERRAL",
          notes: "Looking for custom solutions",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date().toISOString(),
          lead_score: 70,
          owner_id: "2"
        }
      ];
      
      console.log('Returning mock leads data');
      return NextResponse.json(mockLeads);
    } else {
      // Forward the request to the backend API
      const response = await fetch(`${BACKEND_API_URL}/api/leads`, {
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
      console.log('Backend API response with leads data:', data);

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Received POST request for creating lead');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for creating lead');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const leadData = await request.json();
    console.log('Lead data:', leadData);

    // Use mock data for development
    const useMockData = getMockDataStatus();
    console.log('Using mock data:', useMockData);

    if (useMockData) {
      // Create a mock lead with an ID
      const mockLead = {
        id: Date.now().toString(),
        ...leadData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Returning created mock lead:', mockLead);
      return NextResponse.json(mockLead, { status: 201 });
    } else {
      // Forward the request to the backend API
      const response = await fetch(`${BACKEND_API_URL}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { 'Authorization': `Bearer ${session.user?.email}` } : {})
        },
        body: JSON.stringify(leadData)
      });

      if (!response.ok) {
        console.error(`Backend API error: ${response.status} ${response.statusText}`);
        return NextResponse.json(
          { error: `Backend API error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('Backend API response with created lead:', data);

      return NextResponse.json(data, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead', details: String(error) },
      { status: 500 }
    );
  }
} 