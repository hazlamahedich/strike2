import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Mock function to generate a meeting summary
function generateMeetingSummary(meetingId: string): {
  summary: string;
  action_items: string[];
} {
  console.log(`Generating summary for meeting ID: ${meetingId}`);
  
  return {
    summary: "The meeting focused on introducing our product features and understanding the client's needs. We discussed pricing options, implementation timeline, and potential integration challenges. The client expressed interest in our analytics capabilities and requested additional information about our API.",
    
    action_items: [
      "Send product documentation to the client",
      "Schedule a follow-up demo of the analytics dashboard",
      "Provide API documentation and integration examples",
      "Prepare a customized pricing proposal",
      "Connect client with a technical resource to discuss integration"
    ]
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    console.log('Received summary request for meeting:', params.meetingId);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for meeting summary');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meetingId = params.meetingId;
    
    if (!meetingId) {
      console.log('Missing meetingId in request');
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Fetch meeting details from the database
    // 2. Use an AI service to generate a summary
    // 3. Store the generated summary

    // For now, we'll use a mock function
    const summaryData = generateMeetingSummary(meetingId);
    console.log('Generated meeting summary:', summaryData);

    // Return the generated summary
    return NextResponse.json(summaryData);
  } catch (error) {
    console.error('Error generating meeting summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate meeting summary' },
      { status: 500 }
    );
  }
} 