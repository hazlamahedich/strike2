'use client';

import React, { useState, useEffect } from 'react';
import { MeetingDialogType, useMeetingDialog } from '@/contexts/MeetingDialogContext';
import { EnhancedMeetingForm } from './EnhancedMeetingForm';
import { Lead } from '@/types/lead';
import { Meeting, MeetingStatus } from '@/lib/types/meeting';
import { createMeeting } from '@/lib/api/meetings';
import { toast } from 'sonner';

export function ContextualScheduleMeetingDialog({
  dialogId
}: {
  dialogId: string;
}) {
  const { closeMeetingDialog, getDialogData } = useMeetingDialog();
  const [isScheduling, setIsScheduling] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);
  
  useEffect(() => {
    const dialogData = getDialogData(dialogId);
    console.log(`ContextualScheduleMeetingDialog - Retrieved dialog data for ${dialogId}:`, dialogData);
    
    if (dialogData && dialogData.data && dialogData.data.leadId) {
      // Create a basic lead object from the leadId
      setLead({
        id: dialogData.data.leadId,
        first_name: `Lead`,
        last_name: `#${dialogData.data.leadId}`,
        email: '',
        phone: '',
        company: '',
        status: 'new',
        source: 'website',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: ''
      });
    }
  }, [dialogId, getDialogData]);
  
  // If we don't have lead data yet, show a loading state
  if (!lead) {
    return (
      <div className="meeting-dialog-content">
        <div className="meeting-dialog-header">
          <h2 className="meeting-dialog-title">Schedule Meeting</h2>
          <button 
            className="meeting-dialog-close" 
            onClick={() => closeMeetingDialog(dialogId)}
          >
            ×
          </button>
        </div>
        <div className="p-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          <p className="ml-2">Loading lead information...</p>
        </div>
      </div>
    );
  }
  
  const handleScheduleSuccess = (scheduledMeeting: Meeting) => {
    toast('Meeting scheduled successfully');
    closeMeetingDialog(dialogId);
  };
  
  const handleScheduleError = () => {
    toast.error('Failed to schedule the meeting');
    setIsScheduling(false);
  };
  
  return (
    <div className="meeting-dialog-content">
      <div className="meeting-dialog-header">
        <h2 className="meeting-dialog-title">Schedule Meeting with Lead #{lead.id}</h2>
        <button 
          className="meeting-dialog-close" 
          onClick={() => closeMeetingDialog(dialogId)}
        >
          ×
        </button>
      </div>
      <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-auto styled-scrollbar p-4">
        <EnhancedMeetingForm
          leadOptions={[lead]}
          onSuccess={(newMeeting) => {
            setIsScheduling(true);
            
            // Create a new meeting
            createMeeting({
              title: newMeeting.title,
              start_time: newMeeting.start_time,
              end_time: newMeeting.end_time,
              location: newMeeting.location || '',
              meeting_type: newMeeting.meeting_type,
              description: newMeeting.description || '',
              lead_id: String(lead.id),
              status: MeetingStatus.SCHEDULED
            }).then(({ data, error }) => {
              if (error) {
                console.error('Error scheduling meeting:', error);
                handleScheduleError();
                return;
              }
              
              handleScheduleSuccess(data);
              setIsScheduling(false);
            }).catch(err => {
              console.error('Exception scheduling meeting:', err);
              handleScheduleError();
            });
          }}
          onCancel={() => closeMeetingDialog(dialogId)}
        />
        
        {isScheduling && (
          <div className="mt-4 flex items-center justify-center p-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="text-sm text-muted-foreground">Scheduling meeting and sending calendar invite...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 