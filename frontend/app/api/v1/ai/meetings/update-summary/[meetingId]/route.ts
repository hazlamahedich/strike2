import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';
import { updateMeeting } from '@/lib/api/meetings';

export async function PUT(
  request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    console.log('Received update summary request for meeting:', params.meetingId);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for updating meeting summary');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meetingId = params.meetingId;
    
    if (!meetingId) {
      console.log('Missing meetingId in request');
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    // Parse request body
    const updateData = await request.json();
    console.log('Update data:', updateData);

    // Check if we should use mock data
    const useMockData = getMockDataStatus();
    console.log('Using mock data:', useMockData);

    if (useMockData) {
      // Use mock data
      const mockMeeting = {
        id: meetingId,
        title: "Updated Meeting",
        description: "This is an updated meeting",
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        location: "Virtual",
        notes: "Meeting notes go here",
        agenda_items: ["Item 1", "Item 2"],
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        summary: updateData.summary || null,
        action_items: updateData.action_items || [],
        comprehensive_summary: updateData.comprehensive_summary || null
      };

      console.log('Returning updated mock meeting with summary:', mockMeeting);
      return NextResponse.json(mockMeeting);
    } else {
      // In a production implementation, you would:
      // 1. Fetch the existing meeting from the database
      // 2. Update it with the new summary data
      // 3. Save it back to the database
      
      // For now, we'll still use mock data but log that we would use real data
      console.log('Would use real data in production');
      
      const mockMeeting = {
        id: meetingId,
        title: "Updated Production Meeting",
        description: "This is an updated production meeting (still mock for now)",
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        location: "Virtual",
        notes: "Meeting notes go here",
        agenda_items: ["Item 1", "Item 2"],
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        summary: updateData.summary || null,
        action_items: updateData.action_items || [],
        comprehensive_summary: updateData.comprehensive_summary || null
      };

      console.log('Returning updated meeting with summary (production mode):', mockMeeting);
      return NextResponse.json(mockMeeting);
    }
  } catch (error) {
    console.error('Error updating meeting summary:', error);
    return NextResponse.json(
      { error: 'Failed to update meeting summary' },
      { status: 500 }
    );
  }
} 