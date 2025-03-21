import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import axios from 'axios';
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
    
    // Exchange auth code for tokens using Microsoft OAuth endpoint
    const tokenResponse = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token', 
      new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID || '',
        client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
        code: auth_code,
        redirect_uri: process.env.NEXTAUTH_URL 
          ? `${process.env.NEXTAUTH_URL}/api/auth/callback/microsoft` 
          : '',
        grant_type: 'authorization_code'
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    if (!access_token) {
      return NextResponse.json({ error: 'Failed to get Microsoft access token' }, { status: 400 });
    }
    
    // Calculate expiry timestamp
    const expiresAt = Math.floor(Date.now() / 1000) + expires_in;
    
    // Check if integration already exists
    const { data: existingIntegration } = await supabaseAdmin
      .from('lead_calendar_integrations')
      .select('id')
      .eq('lead_id', lead_id)
      .eq('provider', 'microsoft')
      .single();
    
    let result;
    
    if (existingIntegration) {
      // Update existing integration
      const { data, error } = await supabaseAdmin
        .from('lead_calendar_integrations')
        .update({
          access_token: access_token,
          refresh_token: refresh_token || '',
          expires_at: expiresAt,
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
          provider: 'microsoft',
          access_token: access_token,
          refresh_token: refresh_token || '',
          expires_at: expiresAt,
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
    console.error('Error connecting to Microsoft Calendar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect to Microsoft Calendar' },
      { status: 500 }
    );
  }
} 