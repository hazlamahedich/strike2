import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';

export async function GET(request: NextRequest) {
  try {
    // Get the meeting ID from the query parameters
    const url = new URL(request.url);
    const meetingId = url.searchParams.get('meeting_id');
    
    console.log(`API route called for comprehensive summary with meeting ID: ${meetingId}`);
    
    if (!meetingId) {
      console.log('Missing meeting_id parameter');
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Authentication status:', session ? 'Authenticated' : 'Not authenticated');
    
    // For development purposes, we'll allow unauthenticated requests and use mock data
    const useMockData = true; // Always use mock data for now
    
    // Generate a comprehensive summary
    const comprehensiveSummary = {
      summary: "This meeting covered key aspects of the product offering and addressed the client's concerns about implementation timeline and costs. The client showed particular interest in the analytics features and requested a follow-up demo focused on reporting capabilities.",
      
      insights: [
        "Client's main pain point is lack of visibility into their current process",
        "Decision timeline is approximately 4-6 weeks",
        "Budget constraints may require a phased implementation approach",
        "Client has previous experience with a competitor's product",
        "Technical integration with their existing CRM is a priority"
      ],
      
      action_items: [
        "Send detailed product specifications document",
        "Schedule a technical demo with their IT team",
        "Provide case studies from similar companies in their industry",
        "Prepare a phased implementation proposal with cost breakdown",
        "Follow up on questions about API integration capabilities"
      ],
      
      next_steps: [
        "Schedule technical demo within the next 7 days",
        "Prepare customized proposal addressing budget constraints",
        "Set up a call with our integration specialist and their IT team",
        "Share relevant case studies and success stories",
        "Check in after they've reviewed the documentation"
      ],
      
      company_analysis: {
        company_summary: "Mid-sized technology firm specializing in healthcare solutions with approximately 200 employees and $30M annual revenue.",
        industry: "Healthcare Technology",
        company_size_estimate: "Mid-sized (100-500 employees)",
        strengths: [
          "Strong presence in regional healthcare market",
          "Innovative product offerings",
          "Experienced leadership team"
        ],
        potential_pain_points: [
          "Legacy systems integration challenges",
          "Scaling operations to meet growth",
          "Compliance with healthcare regulations"
        ]
      }
    };
    
    console.log('Returning comprehensive summary data');
    return NextResponse.json(comprehensiveSummary);
    
  } catch (error) {
    console.error('Error generating comprehensive summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate comprehensive summary', details: String(error) },
      { status: 500 }
    );
  }
} 