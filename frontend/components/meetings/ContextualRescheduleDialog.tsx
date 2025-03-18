'use client';

import React, { useState } from 'react';
import { MeetingDialogContent } from '@/components/ui/meeting-dialog';
import { MeetingDialogType } from '@/contexts/MeetingDialogContext';
import { EnhancedMeetingForm } from './EnhancedMeetingForm';
import { Meeting, MeetingStatus } from '@/lib/types/meeting';
import { updateMeeting } from '@/lib/api/meetings';
import { toast } from 'sonner';

interface ContextualRescheduleDialogProps {
  dialogId: string;
  meeting: Meeting;
  handleClose: () => void;
  handleRescheduleSuccess: (rescheduledMeeting: Meeting) => void;
}

export function ContextualRescheduleDialog({
  dialogId,
  meeting,
  handleClose,
  handleRescheduleSuccess
}: ContextualRescheduleDialogProps) {
  console.log("ContextualRescheduleDialog - Rendering for", meeting.title, "- dialogId:", dialogId);
  
  const [isRescheduling, setIsRescheduling] = useState(false);
  
  if (!meeting || !meeting.lead) {
    console.error('ContextualRescheduleDialog - Missing meeting or lead data');
    return null;
  }
  
  // Explicit close handler with logging
  const handleCloseWithLogging = () => {
    console.log("ContextualRescheduleDialog - Closing dialog:", dialogId);
    handleClose();
  };
  
  return (
    <MeetingDialogContent
      dialogId={dialogId}
      dialogType={MeetingDialogType.RESCHEDULE}
      title="Reschedule Meeting"
      onClose={handleCloseWithLogging}
    >
      <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-auto styled-scrollbar p-4">
        <EnhancedMeetingForm
          leadOptions={meeting.lead ? [meeting.lead] : []}
          initialTimeSlot={{
            start_time: meeting.start_time,
            end_time: meeting.end_time
          }}
          onSuccess={(newMeeting) => {
            setIsRescheduling(true);
            
            const rescheduledMeeting = {
              ...meeting,
              start_time: newMeeting.start_time,
              end_time: newMeeting.end_time,
              location: newMeeting.location,
              meeting_type: newMeeting.meeting_type,
              description: newMeeting.description,
              status: MeetingStatus.RESCHEDULED
            };
            
            updateMeeting(meeting.id.toString(), {
              start_time: newMeeting.start_time,
              end_time: newMeeting.end_time,
              location: newMeeting.location,
              meeting_type: newMeeting.meeting_type,
              description: newMeeting.description,
              status: MeetingStatus.RESCHEDULED
            }).then(({ data, error }: { data: any; error: any }) => {
              if (error) {
                console.error('Error rescheduling meeting:', error);
                toast.error('Error', {
                  description: 'Failed to reschedule the meeting',
                });
                setIsRescheduling(false);
                return;
              }
              
              handleRescheduleSuccess(rescheduledMeeting);
              setIsRescheduling(false);
            });
          }}
          onCancel={handleCloseWithLogging}
        />
        
        {isRescheduling && (
          <div className="mt-4 flex items-center justify-center p-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="text-sm text-muted-foreground">Rescheduling meeting and sending calendar invite...</p>
            </div>
          </div>
        )}
      </div>
    </MeetingDialogContent>
  );
} 