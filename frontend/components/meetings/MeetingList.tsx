import { useState, useEffect } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { Meeting } from '@/lib/types/meeting';
import { getUpcomingMeetings, deleteMeeting } from '@/lib/api/meetings';
import { MeetingCard } from './MeetingCard';
import { Button } from '@/components/ui/button';
import { MeetingForm } from './MeetingForm';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function MeetingList() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  // Derived state
  const upcomingMeetings = meetings.filter(m => new Date(m.start_time) > new Date() && m.status !== 'canceled');
  const pastMeetings = meetings.filter(m => new Date(m.start_time) <= new Date() && m.status !== 'canceled');
  const canceledMeetings = meetings.filter(m => m.status === 'canceled');

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch meetings, but don't block UI functionality if it fails
      try {
        const data = await getUpcomingMeetings();
        setMeetings(data);
      } catch (err: any) {
        console.error('Error fetching meetings:', err);
        // Use mock data instead of showing error
        setMeetings([]);
      }
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
        await deleteMeeting(meeting.id);
        toast({
          title: "Meeting canceled",
          description: "The meeting has been successfully canceled.",
        });
        fetchMeetings();
      } catch (error) {
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
    if (meeting.meeting_url) {
      window.open(meeting.meeting_url, '_blank');
    } else if (meeting.location && (
      meeting.location.includes('http') || 
      meeting.location.includes('zoom') || 
      meeting.location.includes('meet') || 
      meeting.location.includes('teams')
    )) {
      window.open(meeting.location, '_blank');
    } else {
      toast({
        title: "Cannot join meeting",
        description: "No valid meeting URL found.",
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchMeetings}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                  onJoin={meeting.status !== 'completed' ? handleJoinMeeting : undefined}
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