import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Define the backend API URL
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Mock data for development and testing
const mockComprehensiveSummary = {
  summary: "This meeting focused on understanding the client's needs for a new CRM system. The client expressed frustration with their current solution's limitations in tracking customer interactions and generating reports. We discussed potential features of our platform that could address these pain points, including customizable dashboards, automated follow-ups, and integration capabilities with their existing tools. The client seemed particularly interested in our analytics features and mobile accessibility.",
  insights: [
    "Client is experiencing significant pain points with their current CRM solution",
    "They value mobile accessibility and real-time analytics",
    "Integration with their existing tools is a key decision factor",
    "They have a team of 50+ sales representatives who would use the system",
    "Their decision timeline is approximately 2-3 months"
  ],
  action_items: [
    "Send a detailed proposal outlining our solution by next Friday",
    "Schedule a demo with their technical team within two weeks",
    "Provide case studies of similar implementations in their industry",
    "Follow up with pricing options based on their team size",
    "Connect them with a current customer for reference"
  ],
  next_steps: [
    "Technical demo scheduled for June 15th",
    "Follow-up meeting with decision makers on June 22nd",
    "Proposal review and Q&A session in early July",
    "Potential pilot program discussion by mid-July"
  ],
  company_analysis: {
    company_summary: "TechSolutions Inc. is a mid-sized technology consulting firm specializing in enterprise software implementation. They have been in business for 12 years and have shown consistent growth, expanding to three additional offices in the past 5 years. Their client base primarily consists of financial services and healthcare organizations.",
    industry: "Technology Consulting",
    company_size_estimate: "150-200 employees",
    strengths: [
      "Strong reputation in financial services sector",
      "Experienced leadership team with industry recognition",
      "Solid financial position with consistent year-over-year growth",
      "Established partnerships with major technology providers"
    ],
    potential_pain_points: [
      "Scaling operations while maintaining service quality",
      "Managing distributed teams across multiple locations",
      "Increasing competition from larger consulting firms",
      "Need for more efficient internal processes and tools"
    ]
  }
};

/**
 * GET handler for comprehensive meeting summary
 */
export async function GET(
  request: NextRequest,
  context: { params: { meetingId: string } }
) {
  console.log('Received GET request for comprehensive meeting summary');
  
  try {
    // Extract the meetingId from the URL path directly to avoid the Next.js warning
    const url = request.url;
    const pathParts = url.split('/');
    const meetingId = pathParts[pathParts.length - 1];
    
    if (!meetingId) {
      console.error('No meetingId provided in URL path');
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }
    
    console.log(`Processing request for meeting ID: ${meetingId}`);
    
    // Get the user session
    const session = await getServerSession(authOptions);
    console.log('Session status:', session ? 'Authenticated' : 'Not authenticated');
    
    // For development purposes, allow unauthenticated requests to return mock data
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // During development, always return mock data for easier testing
    if (isDevelopment) {
      console.log('Development mode: Returning mock data');
      return NextResponse.json(mockComprehensiveSummary);
    }
    
    // In production, require authentication
    if (!session) {
      console.log('User not authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
      // Construct the endpoint URL
      const endpointUrl = `${BACKEND_API_URL}/api/v1/ai/meetings/comprehensive-summary/${meetingId}`;
      console.log(`Calling backend API at: ${endpointUrl}`);
      
      // Forward the request to the backend API
      const response = await fetch(endpointUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`Backend API response status: ${response.status}`);
      
      // If the backend returns an error
      if (!response.ok) {
        console.error(`Backend API error: ${response.status} ${response.statusText}`);
        
        // If we're in development mode and get a 404 or 500, return mock data
        if (isDevelopment && (response.status === 404 || response.status === 500)) {
          console.log('Development mode: Returning mock data due to backend error');
          return NextResponse.json(mockComprehensiveSummary);
        }
        
        // Try to get the error message from the response
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorData.error || 'Unknown error';
        } catch (e) {
          errorMessage = response.statusText || 'Unknown error';
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: response.status }
        );
      }
      
      // Parse the response data
      const data = await response.json();
      console.log('Successfully received data from backend API');
      
      // Return the data from the backend
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error calling backend API:', error);
      
      // In development mode, return mock data on error
      if (isDevelopment) {
        console.log('Development mode: Returning mock data due to error');
        return NextResponse.json(mockComprehensiveSummary);
      }
      
      // Return a generic error response
      return NextResponse.json(
        { error: 'Failed to generate comprehensive summary' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in comprehensive summary route handler:', error);
    
    // Return a generic error response
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 