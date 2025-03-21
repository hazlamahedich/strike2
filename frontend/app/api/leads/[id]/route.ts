import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';
import supabase from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Received request for lead ID: ${params.id}`);
    
    // Check if we should use mock data first
    const useMockData = getMockDataStatus();
    console.log('Using mock data:', useMockData);

    // Skip authentication for mock data mode
    if (!useMockData) {
      // Only check authentication if not using mock data
      const session = await getServerSession(authOptions);
      console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
      
      if (!session) {
        console.log('Unauthorized request for lead');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      console.log('Bypassing authentication check in mock mode');
    }

    if (useMockData) {
      // Use mock data based on the ID
      const id = params.id;
      
      // Create different mock data based on the ID
      const mockLead = {
        id: id,
        first_name: `Test`,
        last_name: `Lead ${id}`,
        email: `lead${id}@example.com`,
        phone: `+1555${id.padStart(7, '0')}`,
        company: `Company ${id}`,
        title: 'Manager',
        status: 'new',
        source: 'website',
        notes: `Mock lead ${id} created for testing purposes`,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      return NextResponse.json(mockLead);
    }
    
    // Fetch from Supabase
    console.log(`Fetching lead ${params.id} from Supabase`);
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lead from database' },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }
    
    console.log('Successfully fetched lead data:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching lead by ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if we should use mock data first
    const useMockData = getMockDataStatus();
    
    // Skip authentication for mock data mode
    if (!useMockData) {
      // Only check authentication if not using mock data
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      console.log('Bypassing authentication check in mock mode for PATCH');
    }

    const id = params.id;
    const body = await request.json();

    if (useMockData) {
      // Simulate updating a lead
      const updatedLead = {
        id,
        ...body,
        updated_at: new Date().toISOString(),
      };
      
      return NextResponse.json(updatedLead);
    }
    
    // Update in Supabase
    const { data, error } = await supabase
      .from('leads')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating lead:', error);
      return NextResponse.json(
        { error: 'Failed to update lead in database' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if we should use mock data first
    const useMockData = getMockDataStatus();
    
    // Skip authentication for mock data mode
    if (!useMockData) {
      // Only check authentication if not using mock data
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      console.log('Bypassing authentication check in mock mode for DELETE');
    }

    const id = params.id;

    if (useMockData) {
      // Simulate deleting a lead
      return NextResponse.json({ success: true });
    }
    
    // Delete from Supabase
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting lead:', error);
      return NextResponse.json(
        { error: 'Failed to delete lead from database' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
} 