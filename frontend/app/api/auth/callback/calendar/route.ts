import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  connectLeadToGoogleCalendar,
  connectLeadToMicrosoftCalendar,
  connectLeadToAppleCalendar
} from '@/lib/services/calendarIntegrationService';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }
  
  const searchParams = request.nextUrl.searchParams;
  const leadId = searchParams.get('lead_id');
  const provider = searchParams.get('provider');
  const code = searchParams.get('code');
  
  if (!leadId || !provider || !code) {
    return NextResponse.redirect(new URL(`/leads?error=missing_params`, request.url));
  }
  
  try {
    if (provider === 'google') {
      await connectLeadToGoogleCalendar(leadId, code);
    } else if (provider === 'microsoft') {
      await connectLeadToMicrosoftCalendar(leadId, code);
    } else if (provider === 'apple') {
      await connectLeadToAppleCalendar(leadId, code);
    } else {
      throw new Error(`Unsupported calendar provider: ${provider}`);
    }
    
    // Redirect back to the lead's page with success message
    return NextResponse.redirect(new URL(`/leads/${leadId}?calendarConnected=true`, request.url));
  } catch (error) {
    console.error('Error connecting calendar:', error);
    return NextResponse.redirect(new URL(`/leads/${leadId}?error=calendar_connection_failed`, request.url));
  }
} 