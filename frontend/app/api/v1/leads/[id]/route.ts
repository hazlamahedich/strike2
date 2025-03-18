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
    console.log(`Received GET request for v1/leads/${id}`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for fetching lead');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use mock data for development
    const useMockData = getMockDataStatus();
    console.log('Using mock lead data:', useMockData);

    if (useMockData) {
      // Use mock data
      const mockLead = {
        id: id,
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
      };
      
      console.log('Returning mock lead data for ID:', id);
      return NextResponse.json(mockLead);
    } else {
      // Forward the request to the backend API
      const response = await fetch(`${BACKEND_API_URL}/api/leads/${id}`, {
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
      console.log('Backend API response with lead data:', data);

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead', details: String(error) },
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
    console.log(`Received PUT request for updating lead ${id}`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for updating lead');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const updateData = await request.json();
    console.log('Lead update data:', updateData);

    // Use mock data for development
    const useMockData = getMockDataStatus();
    console.log('Using mock data:', useMockData);

    if (useMockData) {
      // Update a mock lead
      const mockLead = {
        id: id,
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      console.log('Returning updated mock lead:', mockLead);
      return NextResponse.json(mockLead);
    } else {
      // Forward the request to the backend API
      const response = await fetch(`${BACKEND_API_URL}/api/leads/${id}`, {
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
      console.log('Backend API response with updated lead:', data);

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead', details: String(error) },
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
    console.log(`Received DELETE request for lead ${id}`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for deleting lead');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use mock data for development
    const useMockData = getMockDataStatus();
    console.log('Using mock data:', useMockData);

    if (useMockData) {
      // Simulate deleting a lead
      console.log('Mock deletion of lead with ID:', id);
      return NextResponse.json({ success: true, message: `Lead ${id} deleted successfully` });
    } else {
      // Forward the request to the backend API
      const response = await fetch(`${BACKEND_API_URL}/api/leads/${id}`, {
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

      return NextResponse.json({ success: true, message: `Lead ${id} deleted successfully` });
    }
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead', details: String(error) },
      { status: 500 }
    );
  }
} 