import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { addDays, addHours, format, setHours, setMinutes } from 'date-fns';
import { getLeadTimezone } from '@/lib/utils/geocodingUtils';
import { Lead } from '@/types/lead';
import { getLeadById } from '@/lib/api/leads';
import { supabase } from '@/lib/supabase';
import { getLeadBusyTimes, filterAvailableSlots } from '@/lib/services/calendarIntegrationService';
import { LeadCalendarIntegration } from '@/lib/types/lead';

// Function to generate suggested meeting times
async function generateSuggestedMeetingTimes(meetingType: string, leadId?: string, daysAhead: number = 7): Promise<{
  user_id: string;
  start_date: string;
  end_date: string;
  available_slots: Array<{
    start_time: string;
    end_time: string;
    score?: number;
  }>;
  timezone: string;
}> {
  console.log(`Generating suggested meeting times for type: ${meetingType}, lead: ${leadId}, days ahead: ${daysAhead}`);
  
  // Get the lead's timezone if leadId is provided
  let lead: Lead | null = null;
  let leadTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Default to browser timezone
  
  if (leadId) {
    try {
      const { data } = await getLeadById(leadId);
      lead = data;
      
      if (lead) {
        // Get the lead's timezone from their address
        leadTimezone = await getLeadTimezone(lead);
      }
    } catch (error) {
      console.error('Error fetching lead data:', error);
    }
  }
  
  console.log(`Using timezone: ${leadTimezone} for lead: ${leadId}`);
  
  const now = new Date();
  const startDate = now;
  const endDate = addDays(now, daysAhead);
  
  // Generate time slots based on the lead's timezone
  const availableSlots = [];
  
  // Generate preferred business hours for the lead's timezone
  // Morning hours (9 AM - 11 AM) and Afternoon hours (1 PM - 4 PM)
  const preferredHours = [9, 10, 11, 13, 14, 15, 16];
  
  // Generate slots for each day in the next 'daysAhead' days
  for (let i = 1; i <= daysAhead; i++) {
    const day = addDays(now, i);
    
    // Skip weekends (Saturday and Sunday)
    const dayOfWeek = day.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // Create slots for each preferred hour
    for (const hour of preferredHours) {
      const slotStart = new Date(day);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = addHours(slotStart, 1);
      
      // Calculate a score based on "ideal" meeting times for business
      // Higher scores for mid-morning and early afternoon
      let score = 0.7; // base score
      
      // Preferred times get higher scores
      if (hour === 10 || hour === 14) {
        score = 0.9; // Best times: 10 AM and 2 PM
      } else if (hour === 11 || hour === 15) {
        score = 0.85; // Very good times: 11 AM and 3 PM
      } else if (hour === 9 || hour === 13) {
        score = 0.8; // Good times: 9 AM and 1 PM
      }
      
      // Add some randomness to differentiate similar slots
      score += (Math.random() * 0.05);
      
      availableSlots.push({
        start_time: slotStart.toISOString(),
        end_time: slotEnd.toISOString(),
        score: score
      });
    }
  }
  
  // If we have a lead ID, check for calendar integrations to filter out busy times
  let filteredSlots = [...availableSlots];
  
  if (leadId) {
    try {
      // Check if the lead has calendar integration
      const { data: calendarIntegration, error } = await supabase
        .from('lead_calendar_integrations')
        .select('*')
        .eq('lead_id', leadId)
        .single();
      
      if (calendarIntegration && !error) {
        console.log(`Found calendar integration for lead: ${leadId}, provider: ${calendarIntegration.provider}`);
        
        // Get the lead's busy times from their calendar
        const busyTimes = await getLeadBusyTimes(
          calendarIntegration as LeadCalendarIntegration,
          startDate,
          endDate
        );
        
        console.log(`Found ${busyTimes.length} busy times for lead: ${leadId}`);
        
        // Filter out slots that conflict with the lead's busy times
        filteredSlots = filterAvailableSlots(availableSlots, busyTimes);
        console.log(`Filtered to ${filteredSlots.length} available slots after checking calendar`);
      } else {
        console.log(`No calendar integration found for lead: ${leadId}`);
      }
    } catch (error) {
      console.error('Error checking calendar integration:', error);
    }
  }
  
  // Sort by score (highest first)
  filteredSlots.sort((a, b) => (b.score || 0) - (a.score || 0));
  
  return {
    user_id: "current-user-id", // This would be the actual user ID in a real implementation
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    available_slots: filteredSlots,
    timezone: leadTimezone // Return the lead's timezone
  };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await req.json();
    const { lead_id, meeting_type, days_ahead = 7 } = body;
    
    const result = await generateSuggestedMeetingTimes(meeting_type, lead_id, days_ahead);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating suggested meeting times:', error);
    return NextResponse.json({ error: 'Failed to generate meeting times' }, { status: 500 });
  }
} 