import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { addDays, addHours, format } from 'date-fns';

// Mock function to generate suggested meeting times
function generateSuggestedMeetingTimes(meetingType: string, leadId?: string, daysAhead: number = 7): {
  user_id: string;
  start_date: string;
  end_date: string;
  available_slots: Array<{
    start_time: string;
    end_time: string;
    score?: number;
  }>;
  timezone: string;
} {
  console.log(`Generating suggested meeting times for type: ${meetingType}, lead: ${leadId}, days ahead: ${daysAhead}`);
  
  const now = new Date();
  const startDate = now;
  const endDate = addDays(now, daysAhead);
  
  // Generate some mock time slots
  const availableSlots = [];
  
  // Generate 2 slots per day for the next 'daysAhead' days
  for (let i = 1; i <= daysAhead; i++) {
    const day = addDays(now, i);
    
    // Morning slot (10:00 AM)
    const morningStart = new Date(day);
    morningStart.setHours(10, 0, 0, 0);
    const morningEnd = addHours(morningStart, 1);
    
    availableSlots.push({
      start_time: morningStart.toISOString(),
      end_time: morningEnd.toISOString(),
      score: 0.9 - (Math.random() * 0.2) // Random score between 0.7 and 0.9
    });
    
    // Afternoon slot (2:00 PM)
    const afternoonStart = new Date(day);
    afternoonStart.setHours(14, 0, 0, 0);
    const afternoonEnd = addHours(afternoonStart, 1);
    
    availableSlots.push({
      start_time: afternoonStart.toISOString(),
      end_time: afternoonEnd.toISOString(),
      score: 0.9 - (Math.random() * 0.2) // Random score between 0.7 and 0.9
    });
  }
  
  // Sort by score (highest first)
  availableSlots.sort((a, b) => (b.score || 0) - (a.score || 0));
  
  return {
    user_id: "current-user-id", // This would be the actual user ID in a real implementation
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    available_slots: availableSlots,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // User's local timezone
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('Received availability request');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for availability');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    console.log('Request body:', body);
    
    const { meeting_type, lead_id, days_ahead = 7 } = body;

    if (!meeting_type) {
      console.log('Missing meeting_type in request');
      return NextResponse.json({ error: 'Meeting type is required' }, { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Fetch user's calendar availability
    // 2. Fetch lead's preferences if available
    // 3. Use an AI service to suggest optimal meeting times
    // 4. Consider factors like time of day, day of week, etc.

    // For now, we'll use a mock function
    const availabilityData = generateSuggestedMeetingTimes(meeting_type, lead_id, days_ahead);
    console.log('Generated availability data:', availabilityData);

    // Return the generated availability data
    return NextResponse.json(availabilityData);
  } catch (error) {
    console.error('Error generating availability suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate availability suggestions' },
      { status: 500 }
    );
  }
} 