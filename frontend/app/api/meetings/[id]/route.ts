import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MeetingStatus, MeetingType } from '@/lib/types/meeting';
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';
import supabase from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Received get request for meeting:', params.id);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('Unauthorized request for getting meeting');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meetingId = params.id;
    
    if (!meetingId) {
      console.log('Missing meetingId in request');
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    // Check if we should use mock data
    const useMockData = getMockDataStatus();
    console.log('Using mock data:', useMockData);

    if (useMockData) {
      // Use mock data
      const mockMeeting = {
        id: meetingId,
        title: "Mock Meeting",
        description: "This is a mock meeting",
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        location: "Virtual",
        meeting_type: MeetingType.DISCOVERY,
        status: MeetingStatus.SCHEDULED,
        lead_id: "lead_123",
        notes: "Meeting notes go here",
        agenda_items: ["Item 1", "Item 2"],
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        summary: null,
        action_items: [],
        comprehensive_summary: null
      };

      console.log('Returning mock meeting:', mockMeeting);
      return NextResponse.json(mockMeeting);
    } else {
      // In a production implementation, you would fetch the meeting from the database
      // For now, we'll still use mock data but log that we would use real data
      console.log('Would use real data in production');
      
      const mockMeeting = {
        id: meetingId,
        title: "Production Meeting",
        description: "This is a production meeting (still mock for now)",
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        location: "Virtual",
        meeting_type: MeetingType.DISCOVERY,
        status: MeetingStatus.SCHEDULED,
        lead_id: "lead_123",
        notes: "Meeting notes go here",
        agenda_items: ["Item 1", "Item 2"],
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        summary: null,
        action_items: [],
        comprehensive_summary: null
      };

      console.log('Returning meeting (production mode):', mockMeeting);
      return NextResponse.json(mockMeeting);
    }
  } catch (error) {
    console.error('Error getting meeting:', error);
    return NextResponse.json(
      { error: 'Failed to get meeting' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the meeting ID from the URL parameters
    const meetingId = params.id;
    console.log(`Updating meeting with ID: ${meetingId}`);
    
    // Parse the request body
    const updateData = await request.json();
    console.log('Update data:', updateData);
    
    // Check if we should use mock data
    const useMockData = getMockDataStatus();
    
    if (useMockData) {
      console.log('Using mock data for meeting update');
      
      // Process attachments if provided
      let attachments: Array<any> = [];
      
      if (updateData.attachments && updateData.attachments.length > 0) {
        console.log(`Processing ${updateData.attachments.length} attachments`);
        
        // Process each attachment
        attachments = await Promise.all(
          updateData.attachments.map(async (attachment: any, index: number) => {
            // If the attachment already has a path, it's an existing attachment
            if (attachment.path) {
              console.log(`Existing attachment: ${attachment.filename}`);
              return attachment;
            }
            
            // For new attachments with base64 content
            console.log(`New attachment: ${attachment.filename}`);
            
            // In a real implementation, we would save the file to storage
            // For mock, we'll generate a fake path
            const path = `/mock-storage/meetings/${meetingId}/attachments/${attachment.filename}`;
            
            // Generate a unique ID for the attachment
            const id = `attachment_${Date.now()}_${index}`;
            
            // Return the processed attachment
            return {
              id,
              filename: attachment.filename,
              path,
              content_type: attachment.content_type,
              size: attachment.size,
              url: path // In a real implementation, this would be a URL to access the file
            };
          })
        );
      }
      
      // Check if we should create a version
      if (updateData._create_version && updateData.notes !== undefined) {
        console.log('Creating a new version for notes');
        
        // Import the version service
        const { createNoteVersion } = await import('@/lib/services/versionService');
        
        // Create a new version
        const newVersion = await createNoteVersion(
          meetingId,
          updateData.notes,
          attachments,
          'current-user-id' // In a real implementation, this would be the actual user ID
        );
        
        console.log('Created new version:', newVersion);
        
        // Update the current_note_version_id in the update data
        updateData.current_note_version_id = newVersion.id;
      }
      
      // Remove the _create_version flag as it's not part of the Meeting type
      delete updateData._create_version;
      
      const mockMeeting = {
        id: meetingId,
        title: "Updated Meeting",
        description: "This is an updated meeting",
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        location: "Virtual",
        meeting_type: MeetingType.DISCOVERY,
        status: MeetingStatus.SCHEDULED,
        lead_id: "lead_123",
        notes: updateData.notes || "Meeting notes go here",
        agenda_items: updateData.agenda_items || ["Item 1", "Item 2"],
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        summary: updateData.summary || null,
        action_items: updateData.action_items || [],
        comprehensive_summary: updateData.comprehensive_summary || null,
        attachments: attachments.length > 0 ? attachments : undefined,
        current_note_version_id: updateData.current_note_version_id || null
      };

      console.log('Returning updated mock meeting:', mockMeeting);
      return NextResponse.json(mockMeeting);
    }
    
    // Real implementation with Supabase
    console.log('Using Supabase for meeting update');
    
    // Process attachments if provided
    let processedAttachments: Array<any> = [];
    
    if (updateData.attachments && updateData.attachments.length > 0) {
      console.log(`Processing ${updateData.attachments.length} attachments`);
      
      // Process each attachment
      processedAttachments = await Promise.all(
        updateData.attachments.map(async (attachment: any) => {
          // If the attachment already has a path, it's an existing attachment
          if (attachment.path) {
            console.log(`Existing attachment: ${attachment.filename}`);
            return attachment;
          }
          
          // For new attachments with base64 content
          console.log(`New attachment: ${attachment.filename}`);
          
          // Upload the file to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(
              `meetings/${meetingId}/${attachment.filename}`,
              Buffer.from(attachment.content, 'base64'),
              {
                contentType: attachment.content_type,
                upsert: true
              }
            );
          
          if (uploadError) {
            console.error('Error uploading attachment:', uploadError);
            throw new Error(`Failed to upload attachment: ${uploadError.message}`);
          }
          
          // Get the public URL for the uploaded file
          const { data: urlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(`meetings/${meetingId}/${attachment.filename}`);
          
          // Return the processed attachment
          return {
            filename: attachment.filename,
            path: uploadData.path,
            content_type: attachment.content_type,
            size: attachment.size,
            url: urlData.publicUrl
          };
        })
      );
    }
    
    // Check if we should create a version
    if (updateData._create_version && updateData.notes !== undefined) {
      console.log('Creating a new version for notes');
      
      // Import the version service
      const { createNoteVersion } = await import('@/lib/services/versionService');
      
      // Get the user ID from the session
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || 'anonymous';
      
      // Create a new version
      const newVersion = await createNoteVersion(
        meetingId,
        updateData.notes,
        processedAttachments,
        userId
      );
      
      console.log('Created new version:', newVersion);
      
      // Update the current_note_version_id in the update data
      updateData.current_note_version_id = newVersion.id;
    }
    
    // Remove the _create_version flag as it's not part of the Meeting type
    delete updateData._create_version;
    
    // Prepare the update data
    const updatePayload: any = {};
    
    // Only include fields that are provided in the update data
    if (updateData.title !== undefined) updatePayload.title = updateData.title;
    if (updateData.description !== undefined) updatePayload.description = updateData.description;
    if (updateData.start_time !== undefined) updatePayload.start_time = updateData.start_time;
    if (updateData.end_time !== undefined) updatePayload.end_time = updateData.end_time;
    if (updateData.location !== undefined) updatePayload.location = updateData.location;
    if (updateData.meeting_type !== undefined) updatePayload.meeting_type = updateData.meeting_type;
    if (updateData.status !== undefined) updatePayload.status = updateData.status;
    if (updateData.lead_id !== undefined) updatePayload.lead_id = updateData.lead_id;
    if (updateData.notes !== undefined) updatePayload.notes = updateData.notes;
    if (updateData.agenda_items !== undefined) updatePayload.agenda_items = updateData.agenda_items;
    if (updateData.summary !== undefined) updatePayload.summary = updateData.summary;
    if (updateData.action_items !== undefined) updatePayload.action_items = updateData.action_items;
    if (updateData.comprehensive_summary !== undefined) updatePayload.comprehensive_summary = updateData.comprehensive_summary;
    if (updateData.current_note_version_id !== undefined) updatePayload.current_note_version_id = updateData.current_note_version_id;
    
    // Add attachments if processed
    if (processedAttachments.length > 0) {
      updatePayload.attachments = processedAttachments;
    }
    
    // Update the meeting in Supabase
    const { data, error } = await supabase
      .from('meetings')
      .update(updatePayload)
      .eq('id', meetingId)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error updating meeting:', error);
      return NextResponse.json(
        { error: `Failed to update meeting: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log('Meeting updated successfully:', data);
    
    // Return the updated meeting
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/meetings/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    );
  }
} 