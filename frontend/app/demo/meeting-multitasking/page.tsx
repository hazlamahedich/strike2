'use client';

import React, { useState } from 'react';
import { MeetingDialogProvider } from '@/lib/contexts/MeetingDialogContext';
import { MeetingDialogContainer } from '@/components/ui/meeting-dialog';
import { MeetingDialogTaskbar } from '@/components/ui/meeting-dialog-taskbar';
import { ContextualMeetingDetails, ContextualMeetingSchedule } from '@/components/meetings/ContextualMeetingDialog';
import { Button } from '@/components/ui/button';
import { Meeting, MeetingStatus, MeetingType } from '@/lib/types/meeting';
import { useMeetingDialog, MeetingDialogType } from '@/lib/contexts/MeetingDialogContext';
import { cn } from '@/lib/utils';
import { LeadStatus, LeadSource } from '@/lib/types/lead';
import { ArrowRight, Layers, LayoutGrid, Move, Maximize2, X } from 'lucide-react';

// Sample meeting data
const SAMPLE_MEETINGS: Meeting[] = [
  {
    id: '1',
    title: 'Initial Client Meeting',
    description: 'Discuss project requirements and timeline',
    start_time: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    end_time: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour later
    status: MeetingStatus.SCHEDULED,
    meeting_type: MeetingType.INITIAL_CALL,
    lead_id: '1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    location: 'Zoom Meeting',
    lead: {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      company: 'Acme Inc.',
      email: 'john.doe@example.com',
      phone: '(123) 456-7890',
      status: LeadStatus.QUALIFIED,
      source: LeadSource.WEBSITE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: '2',
    title: 'Product Demo',
    description: 'Demonstrate product features',
    start_time: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
    end_time: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(), // 1.5 hours later
    status: MeetingStatus.SCHEDULED,
    meeting_type: MeetingType.DEMO,
    lead_id: '2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    location: 'Google Meet',
    lead: {
      id: '2',
      first_name: 'Jane',
      last_name: 'Smith',
      company: 'XYZ Corp',
      email: 'jane.smith@example.com',
      phone: '(987) 654-3210',
      status: LeadStatus.CONTACTED,
      source: LeadSource.REFERRAL,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: '3',
    title: 'Follow-up Discussion',
    description: 'Follow up on previous meeting',
    start_time: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    end_time: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour later
    status: MeetingStatus.SCHEDULED,
    meeting_type: MeetingType.FOLLOW_UP,
    lead_id: '3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    location: 'Phone Call',
    lead: {
      id: '3',
      first_name: 'Robert',
      last_name: 'Johnson',
      company: 'ABC Ltd',
      email: 'robert.johnson@example.com',
      phone: '(555) 123-4567',
      status: LeadStatus.NEW,
      source: LeadSource.COLD_CALL,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
];

// MeetingCard component for displaying meeting in the list
function MeetingCard({ meeting, onClick }: { meeting: Meeting; onClick: () => void }) {
  return (
    <div 
      className="p-4 border rounded-md bg-card hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <h3 className="font-medium">{meeting.title}</h3>
      <div className="text-sm text-muted-foreground">
        {new Date(meeting.start_time).toLocaleDateString()} at {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="mt-2 text-sm">
        <span className={cn(
          "px-2 py-0.5 rounded-full text-xs",
          meeting.status === MeetingStatus.SCHEDULED ? "bg-blue-100 text-blue-800" :
          meeting.status === MeetingStatus.COMPLETED ? "bg-green-100 text-green-800" :
          meeting.status === MeetingStatus.CANCELLED ? "bg-red-100 text-red-800" :
          "bg-gray-100 text-gray-800"
        )}>
          {meeting.status}
        </span>
      </div>
      {meeting.lead && (
        <div className="mt-2 text-sm">
          With: {meeting.lead.first_name} {meeting.lead.last_name}
        </div>
      )}
    </div>
  );
}

// Component with the dialog controls
function MeetingDialogDemo() {
  const { openMeetingDialog, arrangeDialogsCascade, arrangeDialogsTile } = useMeetingDialog();
  
  const handleOpenMeetingDetails = (meeting: Meeting) => {
    const dialogId = `meeting-details-${meeting.id}`;
    
    const dialogContent = (
      <ContextualMeetingDetails
        dialogId={dialogId}
        meeting={meeting}
      />
    );
    
    openMeetingDialog(dialogId, MeetingDialogType.DETAILS, dialogContent, { meeting });
  };
  
  const handleScheduleMeeting = () => {
    const dialogId = 'schedule-meeting';
    
    const dialogContent = (
      <ContextualMeetingSchedule
        dialogId={dialogId}
      />
    );
    
    openMeetingDialog(dialogId, MeetingDialogType.SCHEDULE, dialogContent);
  };
  
  const handleOpenAll = () => {
    // Open all meeting dialogs at once
    SAMPLE_MEETINGS.forEach(meeting => {
      const dialogId = `meeting-details-${meeting.id}`;
      
      const dialogContent = (
        <ContextualMeetingDetails
          dialogId={dialogId}
          meeting={meeting}
        />
      );
      
      openMeetingDialog(dialogId, MeetingDialogType.DETAILS, dialogContent, { meeting });
    });
    
    // Wait a moment then tile them
    setTimeout(() => {
      arrangeDialogsTile();
    }, 100);
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Meeting Multi-Dialog Demo</h1>
      
      <div className="mb-8">
        <p className="text-lg mb-4">
          This demo showcases how multiple meeting dialogs can be active simultaneously, enabling true multitasking.
        </p>
        
        <div className="bg-muted p-6 rounded-lg mb-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Multi-Dialog Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <span className="font-medium">Cascade Windows</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Arrange dialogs in a cascading pattern where each window is slightly offset from the others.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-primary" />
                <span className="font-medium">Tile Windows</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Arrange dialogs in a grid layout, maximizing screen space usage.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Move className="h-5 w-5 text-primary" />
                <span className="font-medium">Drag & Resize</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Move dialogs by dragging the title bar (look for the drag indicator), and resize them using the edges and corners.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Maximize2 className="h-5 w-5 text-primary" />
                <span className="font-medium">Minimize & Maximize</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Minimize dialogs to the taskbar and maximize them to fill the screen.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 my-6">
          <Button onClick={handleScheduleMeeting} className="flex items-center gap-2">
            Schedule New Meeting
          </Button>
          <Button 
            onClick={handleOpenAll} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            Open All Meetings
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Click on any meeting card below to open its details. You can also click the buttons above to open multiple dialogs at once.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        {SAMPLE_MEETINGS.map((meeting) => (
          <MeetingCard
            key={meeting.id}
            meeting={meeting}
            onClick={() => handleOpenMeetingDetails(meeting)}
          />
        ))}
      </div>
      
      <div className="mt-12 p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">How to Use</h2>
        <ol className="list-decimal list-inside space-y-3 text-sm">
          <li>Click on any meeting to open its details in a dialog</li>
          <li>Open multiple meetings to see them stack on top of each other</li>
          <li>Use the <strong>Cascade</strong> or <strong>Tile</strong> buttons in the taskbar to organize multiple dialogs</li>
          <li>Click and drag the dialog header to move windows around (look for the drag indicator on the left side of the title bar)</li>
          <li>Drag the edges or corners to resize a dialog</li>
          <li>Click on any dialog to bring it to the front</li>
          <li>Use the minimize button to hide a dialog (it remains accessible from the taskbar)</li>
          <li>Use the maximize button to expand a dialog to fill the screen</li>
        </ol>
      </div>
    </div>
  );
}

// Main page component with providers
export default function MeetingMultitaskingDemo() {
  return (
    <MeetingDialogProvider>
      <MeetingDialogDemo />
      <MeetingDialogContainer />
      <MeetingDialogTaskbar />
    </MeetingDialogProvider>
  );
} 