import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const leadId = params.id;
    
    if (!leadId) {
      return NextResponse.json({ error: 'Missing lead ID' }, { status: 400 });
    }
    
    // Get the lead's calendar integration from the database
    const { data, error } = await supabaseAdmin
      .from('lead_calendar_integrations')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error code
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data) {
      return NextResponse.json(null);
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching calendar integration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch calendar integration' },
      { status: 500 }
    );
  }
} 