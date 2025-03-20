'use client';

import React, { useState, useEffect } from 'react';
import { MeetingDialogContent } from '@/components/ui/meeting-dialog';
import { MeetingDialogType, useMeetingDialog } from '@/lib/contexts/MeetingDialogContext';
import { EnhancedMeetingForm } from './EnhancedMeetingForm';
import { Lead as TypesLead } from '@/types/lead';
import { Lead } from '@/lib/types/lead';
import { Meeting, MeetingStatus } from '@/lib/types/meeting';
import { createMeeting } from '@/lib/api/meetings';
import { toast } from 'sonner';

// Generic Lead interface that works with both types in the codebase
interface GenericLead {
  id: string | number;
  first_name?: string;
  last_name?: string;
  name?: string; // For lib/types/lead.ts
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // For any other properties
}

interface ScheduleMeetingDialogProps {
  dialogId: string;
  lead: GenericLead;
  handleClose: () => void;
  handleScheduleSuccess: (scheduledMeeting: Meeting) => void;
}

// Wrapper component that works with the context system
export function ContextualScheduleMeetingDialog({
  dialogId
}: {
  dialogId: string;
}) {
  const { closeMeetingDialog, getMeetingDialogData } = useMeetingDialog();
  const [lead, setLead] = useState<Lead | null>(null);

  useEffect(() => {
    const dialogData = getMeetingDialogData(dialogId);
    console.log(`ContextualScheduleMeetingDialog - Retrieved dialog data for ${dialogId}:`, dialogData);
    
    if (dialogData && dialogData.leadId) {
      // Construct a lead object from the leadId - this would typically involve
      // fetching the lead details from an API, but for now we'll create a simple object
      // that has the minimal information needed
      setLead({
        id: dialogData.leadId,
        name: `Lead #${dialogData.leadId}`, // A default display name
        email: '',
        status: ''
      });
    }
  }, [dialogId, getMeetingDialogData]);

  // If we don't have lead data yet, show a loading state
  if (!lead) {
    return (
      <MeetingDialogContent
        dialogId={dialogId}
        dialogType={MeetingDialogType.SCHEDULE}
        onClose={() => closeMeetingDialog(dialogId)}
      >
        <div className="p-4">
          <p>Loading lead information...</p>
        </div>
      </MeetingDialogContent>
    );
  }

  // Once we have the lead, render the actual dialog
  return (
    <ScheduleMeetingDialog
      dialogId={dialogId}
      lead={{
        id: lead.id,
        name: lead.name || `Lead #${lead.id}`,
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        status: lead.status || 'new'
      }}
      handleClose={() => closeMeetingDialog(dialogId)}
      handleScheduleSuccess={(newMeeting) => {
        toast({
          title: 'Success',
          description: 'Meeting scheduled successfully',
        });
        closeMeetingDialog(dialogId);
      }}
    />
  );
}

// Helper function to convert GenericLead to TypesLead for EnhancedMeetingForm
function convertToTypesLead(lead: GenericLead): TypesLead {
  return {
    id: String(lead.id),
    first_name: lead.first_name || (lead.name ? lead.name.split(' ')[0] : 'Unknown'),
    last_name: lead.last_name || (lead.name ? lead.name.split(' ').slice(1).join(' ') : ''),
    email: lead.email || '',
    phone: lead.phone || '',
    company: lead.company || lead.company_name || '',
    status: lead.status || 'new',
    source: lead.source || 'website',
    created_at: lead.created_at || new Date().toISOString(),
    updated_at: lead.updated_at || new Date().toISOString(),
    // Add any other required fields
    notes: lead.notes || ''
  };
}

export function ScheduleMeetingDialog({
  dialogId,
  lead,
  handleClose,
  handleScheduleSuccess
}: ScheduleMeetingDialogProps) {
  // Handle both types of lead objects
  const leadName = lead.name || 
    (lead.first_name && lead.last_name 
      ? `${lead.first_name} ${lead.last_name}` 
      : 'Lead');
  
  console.log("ScheduleMeetingDialog - Rendering for", leadName, "- dialogId:", dialogId);
  
  const [isScheduling, setIsScheduling] = useState(false);
  
  if (!lead) {
    console.error('ScheduleMeetingDialog - Missing lead data');
    return null;
  }

  // Convert to TypesLead for EnhancedMeetingForm
  const typesLead = convertToTypesLead(lead);

  // Explicit close handler with logging
  const handleCloseWithLogging = () => {
    console.log("ScheduleMeetingDialog - Closing dialog:", dialogId);
    handleClose();
  };
  
  return (
    <MeetingDialogContent
      dialogId={dialogId}
      dialogType={MeetingDialogType.SCHEDULE}
      title={`Schedule Meeting with ${leadName}`}
      onClose={handleCloseWithLogging}
    >
      <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-auto styled-scrollbar p-4">
        <EnhancedMeetingForm
          leadOptions={[typesLead]}
          onSuccess={(newMeeting) => {
            setIsScheduling(true);
            
            // Create a new meeting
            createMeeting({
              title: newMeeting.title,
              start_time: newMeeting.start_time,
              end_time: newMeeting.end_time,
              location: newMeeting.location,
              meeting_type: newMeeting.meeting_type,
              description: newMeeting.description,
              lead_id: String(lead.id),
              status: MeetingStatus.SCHEDULED
            }).then(({ data, error }: { data: any; error: any }) => {
              if (error) {
                console.error('Error scheduling meeting:', error);
                toast.error('Error', {
                  description: 'Failed to schedule the meeting',
                });
                setIsScheduling(false);
                return;
              }
              
              // Create a complete meeting object to return
              const scheduledMeeting: Meeting = {
                id: data.id,
                title: newMeeting.title,
                start_time: newMeeting.start_time,
                end_time: newMeeting.end_time,
                location: newMeeting.location,
                meeting_type: newMeeting.meeting_type,
                description: newMeeting.description,
                lead_id: String(lead.id),
                lead: typesLead, // Use the converted lead
                status: MeetingStatus.SCHEDULED,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              handleScheduleSuccess(scheduledMeeting);
              setIsScheduling(false);
            });
          }}
          onCancel={handleCloseWithLogging}
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
    </MeetingDialogContent>
  );
} 