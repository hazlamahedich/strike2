import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';

export async function GET(request: NextRequest) {
  try {
    console.log('Received request for all leads');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for leads');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if we should use mock data
    const useMockData = getMockDataStatus();
    console.log('Using mock data:', useMockData);

    if (useMockData) {
      // Use mock data
      const mockLeads = [
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          phone: "+1234567890",
          company: "Acme Inc",
          position: "CEO",
          status: "New",
          source: "Website",
          notes: "Interested in our enterprise plan",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          phone: "+1987654321",
          company: "XYZ Corp",
          position: "CTO",
          status: "Qualified",
          source: "Referral",
          notes: "Looking for a solution to scale their operations",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Bob Johnson",
          email: "bob@example.com",
          phone: "+1122334455",
          company: "123 Industries",
          position: "COO",
          status: "Contacted",
          source: "LinkedIn",
          notes: "Scheduled a demo for next week",
          created_at: new Date(Date.now() - 259200000).toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      
      return NextResponse.json(mockLeads);
    } else {
      // In a real application, you would fetch data from your database here
      // For example, using Supabase or another database client
      
      // This is a placeholder for actual database integration
      console.error('No database integration implemented yet');
      return NextResponse.json({ error: 'Database integration not implemented' }, { status: 501 });
    }
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required fields' },
        { status: 400 }
      );
    }

    // Check if we should use mock data
    const useMockData = getMockDataStatus();

    if (useMockData) {
      // Simulate creating a new lead
      const newLead = {
        id: Date.now().toString(),
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      return NextResponse.json(newLead);
    } else {
      // In a real application, you would save to your database here
      
      // This is a placeholder for actual database integration
      console.error('No database integration implemented yet');
      return NextResponse.json({ error: 'Database integration not implemented' }, { status: 501 });
    }
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
} 