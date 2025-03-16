'use client';

import React, { useState, useEffect } from 'react';
import { useMeetingDialog, MeetingDialogType } from '@/lib/contexts/MeetingDialogContext';
import { 
  MeetingDialogContent, 
  MeetingDialogHeader, 
  MeetingDialogTitle,
  MeetingDialogFooter
} from '@/components/ui/meeting-dialog';
import { Meeting, MeetingStatus } from '@/lib/types/meeting';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Phone, Mail, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/dateUtils';
import { cn } from '@/lib/utils';

// Define a simple formatTime function since it doesn't exist in dateUtils
const formatTime = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

interface ContextualMeetingDetailsProps {
  dialogId: string;
  meeting: Meeting;
  onClose?: () => void;
}

export function ContextualMeetingDetails({ dialogId, meeting, onClose }: ContextualMeetingDetailsProps) {
  const { closeMeetingDialog, openMeetingDialog } = useMeetingDialog();
  
  const handleClose = () => {
    closeMeetingDialog(dialogId);
    if (onClose) onClose();
  };
  
  const handleReschedule = () => {
    // Create a new dialog for rescheduling
    const rescheduleDialogId = `reschedule-${meeting.id}`;
    
    const rescheduleContent = (
      <MeetingDialogContent 
        dialogId={rescheduleDialogId}
        dialogType={MeetingDialogType.RESCHEDULE}
        title="Reschedule Meeting"
      >
        <div className="p-4">
          <h3 className="text-lg font-medium mb-4">Reschedule Meeting with {meeting.lead?.first_name || 'Client'}</h3>
          <p>Reschedule form would go here...</p>
          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" onClick={() => closeMeetingDialog(rescheduleDialogId)}>
              Cancel
            </Button>
            <Button>Save Changes</Button>
          </div>
        </div>
      </MeetingDialogContent>
    );
    
    openMeetingDialog(rescheduleDialogId, MeetingDialogType.RESCHEDULE, rescheduleContent, { meeting });
  };
  
  const handleCancel = () => {
    // Create a new dialog for cancellation
    const cancelDialogId = `cancel-${meeting.id}`;
    
    const cancelContent = (
      <MeetingDialogContent 
        dialogId={cancelDialogId}
        dialogType={MeetingDialogType.CANCEL}
        title="Cancel Meeting"
      >
        <div className="p-4">
          <h3 className="text-lg font-medium mb-4">Cancel Meeting with {meeting.lead?.first_name || 'Client'}</h3>
          <p>Are you sure you want to cancel this meeting?</p>
          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" onClick={() => closeMeetingDialog(cancelDialogId)}>
              No, Keep Meeting
            </Button>
            <Button variant="destructive">Yes, Cancel Meeting</Button>
          </div>
        </div>
      </MeetingDialogContent>
    );
    
    openMeetingDialog(cancelDialogId, MeetingDialogType.CANCEL, cancelContent, { meeting });
  };

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case MeetingStatus.SCHEDULED:
        return "bg-blue-100 text-blue-800 border-blue-300";
      case MeetingStatus.COMPLETED:
        return "bg-green-100 text-green-800 border-green-300";
      case MeetingStatus.CANCELLED:
        return "bg-red-100 text-red-800 border-red-300";
      case MeetingStatus.RESCHEDULED:
        return "bg-purple-100 text-purple-800 border-purple-300";
      case MeetingStatus.NO_SHOW:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };
  
  return (
    <MeetingDialogContent 
      dialogId={dialogId}
      dialogType={MeetingDialogType.DETAILS}
      title={meeting.title || "Meeting Details"}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">{meeting.title}</h2>
            <Badge className={cn("mt-2", getStatusColor(meeting.status))}>
              {meeting.status}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span>{formatDate(meeting.start_time)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <span>{formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}</span>
          </div>
          
          {meeting.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <span>{meeting.location}</span>
            </div>
          )}
          
          {meeting.lead && (
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              <span>{meeting.lead.first_name} {meeting.lead.last_name}</span>
            </div>
          )}
          
          {meeting.description && (
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Description</h3>
              <p className="text-gray-700">{meeting.description}</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-between mt-6">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel Meeting
            </Button>
            <Button variant="outline" size="sm" onClick={handleReschedule}>
              Reschedule
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </MeetingDialogContent>
  );
}

interface ContextualMeetingScheduleProps {
  dialogId: string;
  leadId?: number;
  onClose?: () => void;
}

export function ContextualMeetingSchedule({ dialogId, leadId, onClose }: ContextualMeetingScheduleProps) {
  const { closeMeetingDialog } = useMeetingDialog();
  
  const handleClose = () => {
    closeMeetingDialog(dialogId);
    if (onClose) onClose();
  };
  
  return (
    <MeetingDialogContent 
      dialogId={dialogId}
      dialogType={MeetingDialogType.SCHEDULE}
      title="Schedule a Meeting"
    >
      <div className="p-4">
        <h3 className="text-lg font-medium mb-4">Schedule a Meeting</h3>
        <p>Meeting scheduling form would go here...</p>
        <div className="flex justify-end mt-4 gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button>Save Meeting</Button>
        </div>
      </div>
    </MeetingDialogContent>
  );
} 