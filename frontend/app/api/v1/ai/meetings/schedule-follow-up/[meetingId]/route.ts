import { NextRequest, NextResponse } from 'next/server';
import { 
  checkAuthentication, 
  createBadRequestResponse, 
  createServerErrorResponse, 
  createSuccessResponse,
  handleOptionsRequest
} from '@/lib/utils/apiAuthUtils';

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
  context: { params: { meetingId: string } }
) {
  try {
    const { meetingId } = await Promise.resolve(context.params);
    console.log('Received schedule follow-up request for meeting:', meetingId);
    
    // Check authentication with our utility function
    const { isAuthenticated, shouldBypass } = await checkAuthentication(request);
    
    // If not authenticated and not in development mode, return unauthorized
    if (!isAuthenticated && !shouldBypass) {
      console.log('Unauthorized request for scheduling follow-up');
      return createBadRequestResponse('Unauthorized');
    }

    if (!meetingId) {
      console.log('Missing meetingId in request');
      return createBadRequestResponse('Meeting ID is required');
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

    // Return the task data with success response
    return createSuccessResponse({ task_id: taskData.task_id });
  } catch (error) {
    console.error('Error scheduling follow-up task:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return createServerErrorResponse('Failed to schedule follow-up task');
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request);
} 