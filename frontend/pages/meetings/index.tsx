import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Plus, Calendar, List, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

import { EnhancedMeetingForm } from '@/components/meetings/EnhancedMeetingForm';
import { EnhancedMeetingDetails } from '@/components/meetings/EnhancedMeetingDetails';
import { EnhancedCalendarView } from '@/components/meetings/EnhancedCalendarView';

import { Meeting } from '@/lib/types/meeting';
import { Lead } from '@/lib/types/lead';
import { TimeSlot } from '@/lib/services/aiMeetingService';
import { getMeetings } from '@/lib/api/meetings';
import { getLeads } from '@/lib/api/leads';

// Define a local ApiResponse interface to avoid import issues
interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

interface ApiResponse<T> {
  data: T;
  error: ApiError | null;
}

// Import meeting dialog components
import { MeetingDialogProvider } from '@/lib/contexts/MeetingDialogContext';
import { MeetingDialogContainer } from '@/components/ui/meeting-dialog';
import { MeetingDialogTaskbar } from '@/components/ui/meeting-dialog-taskbar';
import { ContextualEnhancedMeetingDetails } from '@/components/meetings/ContextualEnhancedMeetingDetails';
import { MeetingDialogType, useMeetingDialog } from '@/lib/contexts/MeetingDialogContext';

// Wrap the main page component with MeetingDialogProvider
const MeetingsPageContent = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('calendar');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  
  // Access the meeting dialog context
  const { openMeetingDialog } = useMeetingDialog();
  
  // Load meetings and leads data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch meetings
        const meetingsResponse = await getMeetings() as unknown as ApiResponse<Meeting[]>;
        if (meetingsResponse.error) {
          throw new Error(meetingsResponse.error.message);
        }
        setMeetings(meetingsResponse.data || []);
        
        // Fetch leads
        const leadsResponse = await getLeads() as unknown as ApiResponse<Lead[]>;
        if (leadsResponse.error) {
          throw new Error(leadsResponse.error.message);
        }
        setLeads(leadsResponse.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load meetings data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle meeting creation
  const handleMeetingCreated = (newMeeting: Meeting) => {
    setMeetings([...meetings, newMeeting]);
    setShowMeetingForm(false);
    toast({
      title: 'Success',
      description: 'Meeting created successfully',
    });
  };
  
  // Handle meeting update
  const handleMeetingUpdated = (updatedMeeting: Meeting) => {
    console.log('Meeting updated in index page:', updatedMeeting);
    
    // Deep clone the updated meeting to avoid reference issues
    const clonedMeeting = JSON.parse(JSON.stringify(updatedMeeting));
    
    // Update the meetings list with the updated meeting
    setMeetings(
      meetings.map((meeting) =>
        meeting.id === clonedMeeting.id ? clonedMeeting : meeting
      )
    );
    
    // Update the selected meeting if it's the one that was updated
    if (selectedMeeting && selectedMeeting.id === clonedMeeting.id) {
      console.log('Updating selected meeting with:', clonedMeeting);
      setSelectedMeeting(clonedMeeting);
    }
    
    toast({
      title: 'Success',
      description: 'Meeting updated successfully',
    });
  };
  
  // Handle time slot selection from calendar
  const handleTimeSlotSelected = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setShowMeetingForm(true);
  };
  
  // Handle meeting selection from calendar
  const handleMeetingSelected = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    
    // Use the ContextualEnhancedMeetingDetails component with MeetingDialogContext
    const dialogId = `meeting-details-${meeting.id}`;
    
    const dialogContent = (
      <ContextualEnhancedMeetingDetails
        dialogId={dialogId}
        meeting={meeting}
        onClose={() => {
          // Refresh meetings after a meeting is updated
          const fetchMeetings = async () => {
            try {
              const { data } = await getMeetings();
              if (data) {
                setMeetings(data);
              }
            } catch (error) {
              console.error('Error refreshing meetings:', error);
            }
          };
          
          fetchMeetings();
        }}
      />
    );
    
    openMeetingDialog(dialogId, MeetingDialogType.DETAILS, dialogContent, { meeting });
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meetings</h1>
        <Button onClick={() => setShowMeetingForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Meeting
        </Button>
      </div>
      
      <div className="flex items-center">
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="calendar">
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="mr-2 h-4 w-4" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-sm text-blue-600">
            <Sparkles className="mr-1 h-4 w-4" />
            AI-Enhanced
          </div>
        </div>
      </div>
      
      <TabsContent value="calendar" className="mt-6">
        <EnhancedCalendarView
          meetings={meetings}
          leads={leads}
          onSelectTimeSlot={handleTimeSlotSelected}
          onSelectMeeting={handleMeetingSelected}
        />
      </TabsContent>
      
      <TabsContent value="list" className="mt-6">
        <div className="grid gap-4">
          {meetings.length > 0 ? (
            meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => handleMeetingSelected(meeting)}
              >
                <h3 className="font-medium">{meeting.title}</h3>
                <div className="text-sm text-gray-500">
                  {new Date(meeting.start_time).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              No meetings found. Create your first meeting!
            </div>
          )}
        </div>
      </TabsContent>
      
      {/* Meeting Form Dialog */}
      <Dialog open={showMeetingForm} onOpenChange={setShowMeetingForm}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTimeSlot ? 'Schedule Meeting at Suggested Time' : 'Create New Meeting'}
            </DialogTitle>
          </DialogHeader>
          
          <EnhancedMeetingForm
            leadOptions={leads}
            initialTimeSlot={selectedTimeSlot}
            onSuccess={handleMeetingCreated}
            onCancel={() => {
              setShowMeetingForm(false);
              setSelectedTimeSlot(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Wrap the page with the MeetingDialogProvider
export default function MeetingsPage() {
  return (
    <MeetingDialogProvider>
      <MeetingsPageContent />
      <MeetingDialogContainer />
      <MeetingDialogTaskbar />
    </MeetingDialogProvider>
  );
} 