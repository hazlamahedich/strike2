'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ImprovedDialogProvider, useImprovedDialog } from '@/lib/contexts/ImprovedDialogContext';
import { ImprovedDialogRoot, ImprovedDialogContent, ImprovedDialogHeader, ImprovedDialogTitle, ImprovedDialogDescription, ImprovedDialogFooter, ImprovedDialogContainer } from '@/components/ui/improved-dialog';
import { SimpleMeetingDetails } from './SimpleMeetingDetails';

// Sample meeting data for demo
const SAMPLE_MEETINGS = [
  {
    id: '1',
    title: 'Initial Client Consultation',
    description: 'Discuss requirements and project scope with the new client.',
    start_time: '2023-06-15T10:00:00Z',
    end_time: '2023-06-15T11:00:00Z',
    location: 'Conference Room A',
    status: 'scheduled' as const,
    lead: {
      id: 'lead-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567'
    }
  },
  {
    id: '2',
    title: 'Project Kickoff Meeting',
    description: 'Initial kickoff meeting for the new project with the development team.',
    start_time: '2023-06-16T14:00:00Z',
    end_time: '2023-06-16T15:30:00Z',
    location: 'Virtual Meeting',
    status: 'scheduled' as const,
    lead: {
      id: 'lead-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '(555) 987-6543'
    }
  }
];

// Demo content with buttons to trigger dialogs
function DemoContent() {
  const { openDialog, closeDialog } = useImprovedDialog();
  
  // Function to open a meeting dialog
  const openMeetingDialog = useCallback((meetingId: string) => {
    const meeting = SAMPLE_MEETINGS.find(m => m.id === meetingId);
    if (!meeting) return;
    
    const dialogId = `meeting-${meetingId}`;
    
    // Use the openDialog with the meeting component
    openDialog(
      dialogId,
      <ImprovedDialogContent dialogId={dialogId} className="max-w-3xl">
        <ImprovedDialogHeader>
          <ImprovedDialogTitle>Meeting Details</ImprovedDialogTitle>
          <ImprovedDialogDescription>
            View and interact with meeting information
          </ImprovedDialogDescription>
        </ImprovedDialogHeader>
        
        <div className="py-4">
          <SimpleMeetingDetails 
            meeting={meeting} 
            dialogId={dialogId}
            onClose={() => closeDialog(dialogId)} 
          />
        </div>
      </ImprovedDialogContent>
    );
  }, [openDialog, closeDialog]);
  
  // Open an info dialog
  const openInfoDialog = useCallback(() => {
    const dialogId = 'info-dialog';
    
    openDialog(
      dialogId,
      <ImprovedDialogContent dialogId={dialogId}>
        <ImprovedDialogHeader>
          <ImprovedDialogTitle>About Multiple Dialogs</ImprovedDialogTitle>
        </ImprovedDialogHeader>
        <div className="py-4">
          <p className="mb-4">
            This demo shows how multiple dialogs can be active simultaneously. Try opening both meetings,
            then try clicking the "Email" or "Call" buttons to open child dialogs.
          </p>
          <p>
            Notice how all dialogs remain interactive, unlike the traditional approach where only one dialog
            can be active at a time.
          </p>
        </div>
        <ImprovedDialogFooter>
          <Button onClick={() => closeDialog(dialogId)}>Close</Button>
        </ImprovedDialogFooter>
      </ImprovedDialogContent>
    );
  }, [openDialog, closeDialog]);
  
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Multiple Dialog Demo</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>About This Demo</CardTitle>
          <CardDescription>
            Demonstration of multiple dialogs that can remain open and interactive simultaneously
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This page demonstrates a solution for having multiple dialogs open and active at the same time.
            The implementation uses React Context to manage dialog state and custom components to override
            the default Radix UI Dialog behavior.
          </p>
          <p>
            Click the buttons below to open sample meeting dialogs, then try opening other dialogs
            from within the open ones.
          </p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={openInfoDialog}>Learn More</Button>
        </CardFooter>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {SAMPLE_MEETINGS.map(meeting => (
          <Card key={meeting.id}>
            <CardHeader>
              <CardTitle>{meeting.title}</CardTitle>
              <CardDescription>
                {new Date(meeting.start_time).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-2">{meeting.description}</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => openMeetingDialog(meeting.id)}>
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* Dialogs will be rendered by the ImprovedDialogContainer */}
      <ImprovedDialogContainer />
    </div>
  );
}

// Wrap the demo with the provider
export default function MultiDialogDemo() {
  return (
    <ImprovedDialogProvider>
      <DemoContent />
    </ImprovedDialogProvider>
  );
} 