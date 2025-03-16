'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Meeting } from '@/lib/types/meeting';
import { Card } from '@/components/ui/card';
import { EnhancedMeetingDetails } from './EnhancedMeetingDetails';
import { useMeetingDialog, MeetingDialogType } from '@/contexts/MeetingDialogContext';
import { MeetingDialogContent } from '@/components/ui/meeting-dialog';

// Extended Meeting type to include agenda_items
interface EnhancedMeeting extends Meeting {
  agenda_items?: string[];
}

// Props for the ContextualEnhancedMeetingDetails component
interface ContextualEnhancedMeetingDetailsProps {
  dialogId: string;
  meeting: EnhancedMeeting;
  onClose?: () => void;
}

export function ContextualEnhancedMeetingDetails({ 
  dialogId, 
  meeting: initialMeeting, 
  onClose 
}: ContextualEnhancedMeetingDetailsProps) {
  const { closeMeetingDialog, openMeetingDialog, isDialogOpen } = useMeetingDialog();
  // Add state to handle meeting updates without closing/reopening dialog
  const [meeting, setMeeting] = useState<EnhancedMeeting>(initialMeeting);
  
  console.log('⭐⭐⭐ CONTEXTUAL DETAILS: Component rendering with dialogId:', dialogId);
  console.log('⭐⭐⭐ CONTEXTUAL DETAILS: Meeting title:', meeting.title);
  console.log('⭐⭐⭐ CONTEXTUAL DETAILS: Context check - is dialog open?', isDialogOpen(dialogId));

  // Update local meeting state if props change
  useEffect(() => {
    setMeeting(initialMeeting);
  }, [initialMeeting]);

  // Add effect to log when component mounts/unmounts
  useEffect(() => {
    console.log('⭐⭐⭐ CONTEXTUAL DETAILS: Component MOUNTED for dialog:', dialogId);
    console.log('⭐⭐⭐ CONTEXTUAL DETAILS: Is dialog open in context?', isDialogOpen(dialogId));
    
    return () => {
      console.log('⭐⭐⭐ CONTEXTUAL DETAILS: Component UNMOUNTED for dialog:', dialogId);
    };
  }, [dialogId, isDialogOpen]);
  
  // Handler for updating a meeting - modified to update state without dialog reopening
  const handleMeetingUpdated = useCallback((updatedMeeting: EnhancedMeeting) => {
    console.log('⭐⭐⭐ CONTEXTUAL DETAILS: Meeting updated in React Context dialog:', updatedMeeting.title);
    console.log('⭐⭐⭐ CONTEXTUAL DETAILS: Updating meeting state WITHOUT closing/reopening dialog');
    
    // Simply update the local state instead of closing/reopening dialog
    setMeeting(updatedMeeting);
    
    // Optional: Update any global state if needed
    // But do NOT close and reopen the dialog!
  }, []);
  
  // Handler for closing the dialog
  const handleClose = useCallback(() => {
    console.log('⭐⭐⭐ CONTEXTUAL DETAILS: Closing dialog:', dialogId);
    closeMeetingDialog(dialogId);
    if (onClose) {
      onClose();
    }
  }, [dialogId, onClose, closeMeetingDialog]);
  
  console.log('⭐⭐⭐ CONTEXTUAL DETAILS: Rendering MeetingDialogContent');
  
  return (
    <MeetingDialogContent 
      dialogId={dialogId}
      dialogType={MeetingDialogType.DETAILS}
      title={meeting.title || "Meeting Details"}
    >
      <div className="p-4">
        <EnhancedMeetingDetails
          meeting={meeting}
          onUpdate={handleMeetingUpdated}
          onClose={handleClose}
        />
      </div>
    </MeetingDialogContent>
  );
} 