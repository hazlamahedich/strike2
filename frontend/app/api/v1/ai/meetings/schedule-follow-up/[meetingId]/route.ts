import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Mock function to schedule a follow-up task
function scheduleFollowUpTask(meetingId: string, daysDelay: number = 3): {
  task_id: string;
  scheduled_date: string;
  title: string;
  description: string;
} {
  console.log(`Scheduling follow-up task for meeting ID: ${meetingId} with ${daysDelay} days delay`);
  
  // Calculate the scheduled date
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + daysDelay);
  
  return {
    task_id: `task-${Date.now()}`,
    scheduled_date: scheduledDate.toISOString(),
    title: `Follow up on meeting ${meetingId}`,
    description: "Send follow-up email and check if client has reviewed the documentation. Address any questions they might have and schedule the next meeting if appropriate."
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    console.log('Received schedule follow-up request for meeting:', params.meetingId);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for scheduling follow-up');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meetingId = params.meetingId;
    
    if (!meetingId) {
      console.log('Missing meetingId in request');
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const daysDelay = parseInt(url.searchParams.get('days_delay') || '3', 10);

    // In a real implementation, you would:
    // 1. Fetch meeting details from the database
    // 2. Generate a follow-up message
    // 3. Create a task in the database
    // 4. Schedule a notification or reminder

    // For now, we'll use a mock function
    const taskData = scheduleFollowUpTask(meetingId, daysDelay);
    console.log('Scheduled follow-up task:', taskData);

    // Return the task data
    return NextResponse.json({ task_id: taskData.task_id });
  } catch (error) {
    console.error('Error scheduling follow-up task:', error);
    return NextResponse.json(
      { error: 'Failed to schedule follow-up task' },
      { status: 500 }
    );
  }
} 