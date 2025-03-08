import { useState, useEffect } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { Meeting, MeetingStatus } from '@/lib/types/meeting';
import { getUpcomingMeetings, deleteMeeting } from '@/lib/api/meetings';
import { MeetingCard } from './MeetingCard';
import { Button } from '@/components/ui/button';
import { MeetingForm } from './MeetingForm';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { USE_MOCK_DATA } from '@/lib/config';
import { MOCK_MEETINGS } from '@/lib/mock/meetings';
import { ApiResponse } from '@/lib/api/client';

export function MeetingList() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  // Derived state - ensure meetings is always an array before filtering
  const upcomingMeetings = Array.isArray(meetings) 
    ? meetings.filter(m => new Date(m.start_time) > new Date() && m.status !== MeetingStatus.CANCELED)
    : [];
  const pastMeetings = Array.isArray(meetings)
    ? meetings.filter(m => new Date(m.start_time) <= new Date() && m.status !== MeetingStatus.CANCELED)
    : [];
  const canceledMeetings = Array.isArray(meetings)
    ? meetings.filter(m => m.status === MeetingStatus.CANCELED)
    : [];

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (USE_MOCK_DATA) {
        // Use mock data when the flag is set to true
        console.log('Using mock meeting data for MeetingList');
        setMeetings(MOCK_MEETINGS);
      } else {
        // Use real API data when the flag is set to false
        console.log('Fetching meetings from API');
        try {
          const response = await getUpcomingMeetings(30); // Get meetings for the next 30 days
          
          // Check if response is an ApiResponse object with data property
          if (response && typeof response === 'object' && 'data' in response) {
            const apiResponse = response as unknown as ApiResponse<Meeting[]>;
            if (apiResponse.error) {
              throw new Error(apiResponse.error.message || 'Failed to fetch meetings');
            }
            // Ensure data is an array
            const meetingsData = Array.isArray(apiResponse.data) ? apiResponse.data : [];
            console.log('Meetings data from API:', meetingsData);
            setMeetings(meetingsData);
          } else if (Array.isArray(response)) {
            // If response is already an array, use it directly
            console.log('Meetings array from API:', response);
            setMeetings(response);
          } else {
            // If response is neither an ApiResponse nor an array, log and use empty array
            console.error('Unexpected response format:', response);
            setError('Received unexpected data format from API');
            setMeetings([]);
          }
        } catch (apiError: any) {
          console.error('Error fetching meetings:', apiError);
          setError('Failed to load meetings. Please try again later.');
          // Fall back to mock data if API fails
          setMeetings(MOCK_MEETINGS);
        }
      }
    } catch (err: any) {
      console.error('Error in fetchMeetings:', err);
      setError('An unexpected error occurred. Please try again later.');
      // Fall back to mock data if there's an exception
      setMeetings(MOCK_MEETINGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleCreateMeeting = () => {
    console.log('Schedule Meeting button clicked');
    
    // Use the native HTML dialog element
    const dialog = document.getElementById('meeting-dialog') as HTMLDialogElement;
    if (dialog) {
      console.log('Opening native dialog');
      dialog.showModal();
    } else {
      console.error('Dialog element not found');
    }
  };

  const handleEditMeeting = (meeting: Meeting) => {
    console.log('Edit meeting clicked for meeting:', meeting.id);
    setEditingMeeting(meeting);
    
    // Use the native HTML dialog element
    const dialog = document.getElementById('edit-meeting-dialog') as HTMLDialogElement;
    if (dialog) {
      console.log('Opening edit dialog');
      dialog.showModal();
    } else {
      console.error('Edit dialog element not found');
    }
  };

  const handleDeleteMeeting = async (meeting: Meeting) => {
    if (window.confirm(`Are you sure you want to cancel the meeting "${meeting.title}"?`)) {
      try {
        if (USE_MOCK_DATA) {
          // Update the meeting status locally for mock data
          const updatedMeetings = meetings.map(m => 
            m.id === meeting.id 
              ? { ...m, status: MeetingStatus.CANCELED, updated_at: new Date().toISOString() } 
              : m
          );
          setMeetings(updatedMeetings);
        } else {
          // Call the API to delete/cancel the meeting
          try {
            const response = await deleteMeeting(meeting.id);
            
            if (response.error) {
              throw new Error(response.error.message || 'Failed to cancel meeting');
            }
            
            console.log('Meeting canceled successfully:', response.data);
            
            // Update the local state after successful API call
            const updatedMeetings = meetings.map(m => 
              m.id === meeting.id 
                ? { ...m, status: MeetingStatus.CANCELED, updated_at: new Date().toISOString() } 
                : m
            );
            setMeetings(updatedMeetings);
          } catch (apiError: any) {
            console.error('API error canceling meeting:', apiError);
            throw new Error('Failed to cancel meeting via API');
          }
        }
        
        toast({
          title: "Meeting canceled",
          description: "The meeting has been successfully canceled.",
        });
      } catch (error: any) {
        console.error('Failed to delete meeting:', error);
        toast({
          title: "Failed to cancel meeting",
          description: "There was an error canceling the meeting. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleJoinMeeting = (meeting: Meeting) => {
    let meetingUrl = '';
    
    // Extract meeting URL based on different platforms
    if (meeting.location) {
      // Check for direct URLs
      if (meeting.location.includes('http')) {
        meetingUrl = meeting.location;
      } 
      // Check for Zoom meeting ID
      else if (meeting.location.includes('zoom')) {
        const zoomIdMatch = meeting.location.match(/(\d{9,11})/);
        if (zoomIdMatch) {
          meetingUrl = `https://zoom.us/j/${zoomIdMatch[1]}`;
        } else {
          meetingUrl = 'https://zoom.us/join';
        }
      } 
      // Check for Google Meet
      else if (meeting.location.includes('meet')) {
        const meetCodeMatch = meeting.location.match(/([a-z0-9\-]{3,20})/i);
        if (meetCodeMatch) {
          meetingUrl = `https://meet.google.com/${meetCodeMatch[1]}`;
        } else {
          meetingUrl = 'https://meet.google.com/';
        }
      } 
      // Check for Skype
      else if (meeting.location.includes('skype')) {
        const skypeIdMatch = meeting.location.match(/([a-zA-Z0-9\.\:\_]+)/);
        if (skypeIdMatch) {
          meetingUrl = `https://web.skype.com/call/${skypeIdMatch[1]}`;
        } else {
          meetingUrl = 'https://web.skype.com/';
        }
      } 
      // Check for Microsoft Teams
      else if (meeting.location.includes('teams')) {
        meetingUrl = 'https://teams.microsoft.com/';
      }
    }
    
    if (meetingUrl) {
      // Mark the meeting as joined
      const updatedMeetings = meetings.map(m => 
        m.id === meeting.id 
          ? { ...m, joined: true, join_time: new Date().toISOString() } 
          : m
      );
      setMeetings(updatedMeetings);
      
      // Open meeting URL
      window.open(meetingUrl, '_blank');
      
      toast({
        title: "Meeting joined",
        description: "This activity has been added to the lead timeline.",
      });
    } else {
      toast({
        title: "Cannot join meeting",
        description: "This meeting does not have a valid virtual location.",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    console.log('Form submitted successfully');
    
    // Refresh the meetings list
    fetchMeetings();
    
    // Show success toast
    toast({
      title: "Success",
      description: "Meeting has been scheduled successfully.",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {USE_MOCK_DATA && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">Using mock data. Set USE_MOCK_DATA to false in config.ts to use real data.</span>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Your Meetings</h3>
        <div className="flex space-x-2">
          <Button onClick={handleCreateMeeting}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="canceled">
            Canceled ({canceledMeetings.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-6">
          {upcomingMeetings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onEdit={handleEditMeeting}
                  onDelete={handleDeleteMeeting}
                  onJoin={handleJoinMeeting}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium mb-2">No upcoming meetings</h4>
              <p className="text-muted-foreground max-w-md mb-4">
                You don't have any upcoming meetings scheduled.
              </p>
              <Button onClick={handleCreateMeeting}>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="mt-6">
          {pastMeetings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onJoin={meeting.status !== MeetingStatus.COMPLETED ? handleJoinMeeting : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium mb-2">No past meetings</h4>
              <p className="text-muted-foreground max-w-md">
                You don't have any past meetings.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="canceled" className="mt-6">
          {canceledMeetings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {canceledMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium mb-2">No canceled meetings</h4>
              <p className="text-muted-foreground max-w-md">
                You don't have any canceled meetings.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Native HTML dialog element */}
      <dialog 
        id="meeting-dialog" 
        className="fixed inset-0 z-50 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-[600px] w-full"
        style={{ margin: 'auto' }}
      >
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Schedule a Meeting</h3>
            <button 
              type="button"
              className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => {
                const dialog = document.getElementById('meeting-dialog') as HTMLDialogElement;
                if (dialog) dialog.close();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <MeetingForm 
            onSuccess={() => {
              console.log('Form success callback triggered');
              const dialog = document.getElementById('meeting-dialog') as HTMLDialogElement;
              if (dialog) dialog.close();
              handleFormSuccess();
            }} 
            onCancel={() => {
              console.log('Form cancel callback triggered');
              const dialog = document.getElementById('meeting-dialog') as HTMLDialogElement;
              if (dialog) dialog.close();
            }} 
          />
        </div>
      </dialog>

      {/* Native HTML dialog element for editing */}
      <dialog 
        id="edit-meeting-dialog" 
        className="fixed inset-0 z-50 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-[600px] w-full"
        style={{ margin: 'auto' }}
      >
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Edit Meeting</h3>
            <button 
              type="button"
              className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => {
                const dialog = document.getElementById('edit-meeting-dialog') as HTMLDialogElement;
                if (dialog) dialog.close();
                setEditingMeeting(null);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          {editingMeeting && (
            <MeetingForm 
              lead={editingMeeting.lead} 
              onSuccess={() => {
                console.log('Edit form success callback triggered');
                const dialog = document.getElementById('edit-meeting-dialog') as HTMLDialogElement;
                if (dialog) dialog.close();
                handleFormSuccess();
              }} 
              onCancel={() => {
                console.log('Edit form cancel callback triggered');
                const dialog = document.getElementById('edit-meeting-dialog') as HTMLDialogElement;
                if (dialog) dialog.close();
                setEditingMeeting(null);
              }} 
            />
          )}
        </div>
      </dialog>
    </div>
  );
} 