import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { google } from 'googleapis';
import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase/server';

// Microsoft Graph API endpoint
const MICROSOFT_GRAPH_API = 'https://graph.microsoft.com/v1.0';

// Initialize Google API client
const getGoogleCalendarClient = (tokens: {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google` : ''
  );

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { integration_id, provider, start_time, end_time } = body;
    
    if (!integration_id || !provider || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get the calendar integration from the database
    const { data: integration, error } = await supabaseAdmin
      .from('lead_calendar_integrations')
      .select('*')
      .eq('id', integration_id)
      .single();
    
    if (error || !integration) {
      return NextResponse.json({ error: 'Calendar integration not found' }, { status: 404 });
    }
    
    let busyTimes: Array<{ start: string; end: string }> = [];

    // Get busy times based on provider
    if (provider === 'google') {
      busyTimes = await getGoogleCalendarBusyTimes(
        integration,
        new Date(start_time),
        new Date(end_time)
      );
    } else if (provider === 'microsoft') {
      busyTimes = await getMicrosoftCalendarBusyTimes(
        integration,
        new Date(start_time),
        new Date(end_time)
      );
    } else if (provider === 'apple') {
      // Apple Calendar placeholder
      busyTimes = [];
    }
    
    return NextResponse.json({ busy_times: busyTimes });
  } catch (error: any) {
    console.error('Error fetching busy times:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch calendar availability' },
      { status: 500 }
    );
  }
}

/**
 * Get busy times from Google Calendar
 */
async function getGoogleCalendarBusyTimes(
  integration: any,
  startTime: Date,
  endTime: Date
): Promise<Array<{ start: string; end: string }>> {
  try {
    const calendar = getGoogleCalendarClient({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      expiry_date: integration.expires_at * 1000 // Convert to milliseconds
    });

    const freeBusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        items: [{ id: 'primary' }], // Use the lead's primary calendar
      },
    });

    // Extract busy time slots
    const busySlots = freeBusy.data.calendars?.primary?.busy || [];
    return busySlots.map((slot: any) => ({
      start: slot.start || '',
      end: slot.end || ''
    }));
  } catch (error) {
    console.error('Error fetching Google calendar busy times:', error);
    return [];
  }
}

/**
 * Get busy times from Microsoft Calendar
 */
async function getMicrosoftCalendarBusyTimes(
  integration: any,
  startTime: Date,
  endTime: Date
): Promise<Array<{ start: string; end: string }>> {
  try {
    const formattedStartTime = startTime.toISOString();
    const formattedEndTime = endTime.toISOString();
    
    // Use Microsoft Graph API to get calendar view
    const response = await axios.get(
      `${MICROSOFT_GRAPH_API}/me/calendarView?startDateTime=${formattedStartTime}&endDateTime=${formattedEndTime}`,
      {
        headers: {
          Authorization: `Bearer ${integration.access_token}`,
          Prefer: 'outlook.timezone="UTC"'
        }
      }
    );
    
    if (!response.data || !response.data.value) {
      return [];
    }
    
    // Convert Microsoft events to busy slots
    return response.data.value.map((event: any) => ({
      start: event.start.dateTime,
      end: event.end.dateTime
    }));
  } catch (error) {
    console.error('Error fetching Microsoft calendar busy times:', error);
    return [];
  }
} 