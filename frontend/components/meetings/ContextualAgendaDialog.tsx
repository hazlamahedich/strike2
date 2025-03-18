'use client';

import React, { useState } from 'react';
import { MeetingDialogContent } from '@/components/ui/meeting-dialog';
import { MeetingDialogType } from '@/contexts/MeetingDialogContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle } from 'lucide-react';

interface ContextualAgendaDialogProps {
  dialogId: string;
  agendaItems: string[];
  meetingType?: string;
  handleClose: () => void;
  onAddToMeeting?: () => void;
}

export function ContextualAgendaDialog({
  dialogId,
  agendaItems,
  meetingType,
  handleClose,
  onAddToMeeting
}: ContextualAgendaDialogProps) {
  console.log("⭐⭐⭐ CONTEXTUAL AGENDA DIALOG - Rendering for meeting type:", meetingType);
  
  // Format meeting type for display (convert from enum format)
  const formatMeetingType = (type?: string) => {
    if (!type) return "Meeting";
    
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <MeetingDialogContent 
      dialogId={dialogId}
      dialogType={MeetingDialogType.AGENDA}
      title="AI Suggested Agenda"
      onClose={handleClose}
    >
      <div className="sm:max-w-md w-full p-4">
        <p className="text-sm text-muted-foreground mb-4">
          {formatMeetingType(meetingType)} Meeting Agenda
        </p>
        
        <ScrollArea className="max-h-[60vh] mt-4 p-1">
          <div className="space-y-2">
            {agendaItems.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2">
                {agendaItems.map((item, index) => (
                  <li key={index} className="text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No agenda items available. Try generating some suggestions.
              </p>
            )}
          </div>
        </ScrollArea>
        
        <div className="mt-6 flex justify-between">
          {onAddToMeeting && agendaItems.length > 0 && (
            <Button 
              onClick={() => {
                onAddToMeeting();
                handleClose();
              }}
              className="mr-2"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add to Meeting
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </MeetingDialogContent>
  );
} 