import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { lead_id } = body;
    
    if (!lead_id) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    // This is a placeholder. Apple Calendar integration is more complex.
    // Typically, Apple Calendar integration would use CalDAV or iCloud API
    
    // For now, create a placeholder integration
    const { data, error } = await supabaseAdmin
      .from('lead_calendar_integrations')
      .insert({
        lead_id: lead_id,
        provider: 'apple',
        access_token: 'placeholder',
        refresh_token: '',
        expires_at: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create calendar integration: ${error.message}`);
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error connecting to Apple Calendar:', error);
    return NextResponse.json(
      { error: error.message || 'Apple Calendar integration not currently supported' },
      { status: 501 } // 501 Not Implemented
    );
  }
} 