import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Helper function to add CORS headers to a response
function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Mock function to schedule a follow-up task
function scheduleFollowUpTask(meetingId: string, taskDetails: any, daysDelay: number = 3): {
  task_id: string;
  scheduled_date: string;
  title: string;
  description: string;
} {
  console.log(`Scheduling follow-up task for meeting ID: ${meetingId} with ${daysDelay} days delay`);
  console.log('Task details:', taskDetails);
  
  // Calculate the scheduled date
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + daysDelay);
  
  return {
    task_id: `task-${Date.now()}`,
    scheduled_date: scheduledDate.toISOString(),
    title: taskDetails.title || `Follow up on meeting ${meetingId}`,
    description: taskDetails.description || "Send follow-up email and check if client has reviewed the documentation."
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    // Fix: Properly access meetingId from params
    const { meetingId } = params;
    console.log('Received schedule follow-up request for meeting:', meetingId);
    
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    console.log('Environment:', isDev ? 'development' : 'production');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    // In development mode, bypass authentication
    if (!session && !isDev) {
      console.log('Unauthorized request for scheduling follow-up');
      return addCorsHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    if (!meetingId) {
      console.log('Missing meetingId in request');
      return addCorsHeaders(
        NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 })
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    console.log('Request body:', body);
    
    // Get days_delay from body or default to 3
    const daysDelay = body.days_delay || 3;
    
    // Extract task details from body
    const taskDetails = {
      title: body.title,
      description: body.description,
      due_date: body.due_date
    };

    // For now, we'll use a mock function
    const taskData = scheduleFollowUpTask(meetingId, taskDetails, daysDelay);
    console.log('Scheduled follow-up task:', taskData);

    // Return the task data with CORS headers
    return addCorsHeaders(
      NextResponse.json({ task_id: taskData.task_id })
    );
  } catch (error) {
    console.error('Error scheduling follow-up task:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Failed to schedule follow-up task' },
        { status: 500 }
      )
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  console.log('OPTIONS request received for CORS preflight');
  
  // Create a response with CORS headers
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response);
} 