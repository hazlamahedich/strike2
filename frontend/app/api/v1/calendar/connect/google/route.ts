import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { google } from 'googleapis';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { lead_id, auth_code } = body;
    
    if (!lead_id || !auth_code) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    // Exchange auth code for tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google` : ''
    );
    
    const { tokens } = await oauth2Client.getToken(auth_code);
    
    if (!tokens.access_token) {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 400 });
    }
    
    // Check if integration already exists
    const { data: existingIntegration } = await supabaseAdmin
      .from('lead_calendar_integrations')
      .select('id')
      .eq('lead_id', lead_id)
      .eq('provider', 'google')
      .single();
    
    let result;
    
    if (existingIntegration) {
      // Update existing integration
      const { data, error } = await supabaseAdmin
        .from('lead_calendar_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || '',
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingIntegration.id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to update calendar integration: ${error.message}`);
      }
      
      result = data;
    } else {
      // Create new integration
      const { data, error } = await supabaseAdmin
        .from('lead_calendar_integrations')
        .insert({
          lead_id: lead_id,
          provider: 'google',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || '',
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to create calendar integration: ${error.message}`);
      }
      
      result = data;
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error connecting to Google Calendar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect to Google Calendar' },
      { status: 500 }
    );
  }
} 