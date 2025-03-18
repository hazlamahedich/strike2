'use client';

import React from 'react';
import { MeetingDialogContent } from '@/components/ui/meeting-dialog';
import { MeetingDialogType } from '@/contexts/MeetingDialogContext';
import { EnhancedMeetingForm } from './EnhancedMeetingForm';
import { Lead } from '../../types/lead';
import { Meeting } from '@/lib/types/meeting';

interface ContextualScheduleDialogProps {
  dialogId: string;
  lead: Lead;
  handleClose: () => void;
  handleScheduleSuccess: (scheduledMeeting: Meeting) => void;
}

export function ContextualScheduleDialog({
  dialogId,
  lead,
  handleClose,
  handleScheduleSuccess
}: ContextualScheduleDialogProps) {
  console.log("⭐⭐⭐ CONTEXTUAL SCHEDULE DIALOG - Rendering for lead", lead.first_name);
  
  return (
    <MeetingDialogContent
      dialogId={dialogId}
      dialogType={MeetingDialogType.SCHEDULE}
      title="Schedule Meeting"
      onClose={handleClose}
    >
      <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-auto styled-scrollbar p-4">
        <EnhancedMeetingForm
          leadOptions={[lead]}
          onSuccess={(newMeeting) => {
            // Call the handleScheduleSuccess function with the new meeting
            handleScheduleSuccess(newMeeting);
          }}
          onCancel={handleClose}
        />
      </div>
    </MeetingDialogContent>
  );
} 