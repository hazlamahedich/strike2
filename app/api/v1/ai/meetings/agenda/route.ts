import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Define MeetingType enum since we can't import it
enum MeetingType {
  INITIAL_CALL = 'initial_call',
  DISCOVERY = 'discovery',
  DEMO = 'demo',
  PROPOSAL = 'proposal',
  FOLLOW_UP = 'follow_up'
}

// Function to generate agenda suggestions based on meeting type
function generateAgendaSuggestions(meetingType: string, context?: string): string[] {
  // Default suggestions for any meeting type
  const defaultSuggestions = [
    "Welcome and introductions",
    "Review of previous discussions",
    "Current status update",
    "Next steps and action items",
    "Questions and answers"
  ];

  // Specific suggestions based on meeting type
  switch (meetingType) {
    case MeetingType.INITIAL_CALL:
      return [
        "Introduction and rapport building",
        "Overview of company/product/service",
        "Understanding client's needs and pain points",
        "Brief demonstration of relevant solutions",
        "Discuss potential next steps",
        "Q&A session"
      ];
    case MeetingType.DISCOVERY:
      return [
        "Review of previous discussions",
        "Deep dive into client's business processes",
        "Identify key challenges and opportunities",
        "Explore potential solutions",
        "Discuss success metrics and goals",
        "Outline implementation timeline",
        "Next steps and follow-up items"
      ];
    case MeetingType.DEMO:
      return [
        "Brief recap of previous discussions",
        "Overview of solution to be demonstrated",
        "Live demonstration of key features",
        "Addressing specific use cases",
        "Discussion of customization options",
        "Pricing and implementation timeline",
        "Q&A session",
        "Next steps"
      ];
    case MeetingType.PROPOSAL:
      return [
        "Review of requirements and needs",
        "Presentation of proposed solution",
        "Discussion of implementation approach",
        "Timeline and milestones",
        "Pricing and terms",
        "Address questions and concerns",
        "Next steps in the decision process"
      ];
    case MeetingType.FOLLOW_UP:
      return [
        "Review of previous meeting outcomes",
        "Progress update on action items",
        "Discussion of any new developments",
        "Address outstanding questions or concerns",
        "Confirm next steps and timeline",
        "Schedule next check-in"
      ];
    default:
      return defaultSuggestions;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Received agenda suggestion request');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for agenda suggestions');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    console.log('Request body:', body);
    
    const { meeting_type, lead_id, context } = body;

    if (!meeting_type) {
      console.log('Missing meeting_type in request');
      return NextResponse.json({ error: 'Meeting type is required' }, { status: 400 });
    }

    // Generate agenda items
    const agendaItems = generateAgendaSuggestions(meeting_type, context);
    console.log('Generated agenda items:', agendaItems);

    // Return the generated agenda items
    return NextResponse.json({ 
      agenda_items: agendaItems 
    });
  } catch (error) {
    console.error('Error generating agenda suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate agenda suggestions' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Received GET request for agenda suggestions');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for agenda suggestions');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const meetingType = searchParams.get('meeting_type');
    const context = searchParams.get('context');
    
    console.log('Query parameters:', { meetingType, context });

    if (!meetingType) {
      console.log('Missing meeting_type in request');
      return NextResponse.json({ error: 'Meeting type is required' }, { status: 400 });
    }

    // Generate agenda items
    const agendaItems = generateAgendaSuggestions(meetingType, context || undefined);
    console.log('Generated agenda items:', agendaItems);

    // Return the generated agenda items
    return NextResponse.json({ 
      agenda_items: agendaItems 
    });
  } catch (error) {
    console.error('Error generating agenda suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate agenda suggestions' },
      { status: 500 }
    );
  }
} 