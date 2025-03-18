import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MeetingType } from '@/lib/types/meeting';

// Mock function to recommend meeting duration
function recommendMeetingDuration(meetingType: string, leadId?: string): {
  duration_minutes: number;
  explanation?: string;
} {
  console.log(`Recommending duration for meeting type: ${meetingType}, lead: ${leadId}`);
  
  // Default duration
  let duration = 30;
  let explanation = "Standard meeting duration";
  
  // Adjust based on meeting type
  switch (meetingType) {
    case MeetingType.INITIAL_CALL:
      duration = 30;
      explanation = "Initial calls are typically brief introductions and qualification discussions.";
      break;
    case MeetingType.DISCOVERY:
      duration = 60;
      explanation = "Discovery meetings require more time to understand client needs in depth.";
      break;
    case MeetingType.DEMO:
      duration = 45;
      explanation = "Product demonstrations typically need 45 minutes to cover features and answer questions.";
      break;
    case MeetingType.PROPOSAL:
      duration = 60;
      explanation = "Proposal presentations and discussions typically require a full hour.";
      break;
    case MeetingType.NEGOTIATION:
      duration = 45;
      explanation = "Negotiation meetings typically need 45 minutes for detailed discussions.";
      break;
    case MeetingType.FOLLOW_UP:
      duration = 30;
      explanation = "Follow-up meetings are typically shorter check-ins on progress.";
      break;
    default:
      duration = 30;
      explanation = "Standard meeting duration for general discussions.";
  }
  
  return {
    duration_minutes: duration,
    explanation: explanation
  };
}

export async function GET(request: NextRequest) {
  try {
    console.log('Received duration recommendation request');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for duration recommendation');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const meetingType = url.searchParams.get('meeting_type');
    const leadId = url.searchParams.get('lead_id');

    if (!meetingType) {
      console.log('Missing meeting_type in request');
      return NextResponse.json({ error: 'Meeting type is required' }, { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Analyze past meetings of similar type
    // 2. Consider the specific lead's history if available
    // 3. Use an AI service to recommend an optimal duration

    // For now, we'll use a mock function
    const durationData = recommendMeetingDuration(meetingType, leadId || undefined);
    console.log('Recommended duration:', durationData);

    // Return the recommended duration
    return NextResponse.json(durationData);
  } catch (error) {
    console.error('Error recommending meeting duration:', error);
    return NextResponse.json(
      { error: 'Failed to recommend meeting duration' },
      { status: 500 }
    );
  }
} 