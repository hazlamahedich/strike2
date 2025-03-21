import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { lead_id, provider, access_token, refresh_token, expires_at } = body;
    
    if (!lead_id || !provider || !access_token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if an integration already exists for this lead
    const { data: existingIntegration } = await supabase
      .from('lead_calendar_integrations')
      .select('id')
      .eq('lead_id', lead_id)
      .single();
    
    let response;
    
    if (existingIntegration) {
      // Update existing integration
      const { data, error } = await supabase
        .from('lead_calendar_integrations')
        .update({
          provider,
          access_token,
          refresh_token,
          expires_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingIntegration.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating calendar integration:', error);
        return NextResponse.json({ error: 'Failed to update calendar integration' }, { status: 500 });
      }
      
      response = data;
    } else {
      // Create new integration
      const { data, error } = await supabase
        .from('lead_calendar_integrations')
        .insert({
          id: uuidv4(),
          lead_id,
          provider,
          access_token,
          refresh_token,
          expires_at,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating calendar integration:', error);
        return NextResponse.json({ error: 'Failed to create calendar integration' }, { status: 500 });
      }
      
      response = data;
    }
    
    // Don't expose sensitive tokens in the response
    const safeResponse = {
      id: response.id,
      lead_id: response.lead_id,
      provider: response.provider,
      connected: true,
      created_at: response.created_at,
      updated_at: response.updated_at
    };
    
    return NextResponse.json(safeResponse);
  } catch (error) {
    console.error('Error in calendar integration API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 