import { useState, useEffect, useRef } from 'react';
import { Meeting, MeetingStatus, MeetingType } from '@/lib/types/meeting';
import { format, parseISO, isSameDay, addDays, isPast, differenceInMinutes } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Plus, User, Phone, Mail, MessageSquare, Video, Calendar, X, Edit, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { MeetingCard } from './MeetingCard';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MOCK_MEETINGS } from '@/lib/mock/meetings';
import { EnhancedMeetingForm } from './EnhancedMeetingForm';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// FullCalendar imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, DateSelectArg, EventInput } from '@fullcalendar/core';

// Helper function to create dates with specific times
const createDateWithTime = (daysFromNow: number, hours: number, minutes: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

// Use this if MOCK_MEETINGS from lib/mock/meetings is not available
const FALLBACK_MOCK_MEETINGS: Meeting[] = [
  {
    id: 1,
    title: "Initial Client Meeting",
    description: "Discuss project requirements and timeline",
    start_time: createDateWithTime(0, 10, 0), // Today at 10:00 AM
    end_time: createDateWithTime(0, 11, 30), // Today at 11:30 AM
    status: MeetingStatus.SCHEDULED,
    meeting_type: MeetingType.INITIAL_CALL,
    lead_id: 1,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    location: "Zoom Meeting"
  },
  {
    id: 2,
    title: "Product Demo",
    description: "Demonstrate product features",
    start_time: createDateWithTime(3, 14, 0), // 3 days from now at 2:00 PM
    end_time: createDateWithTime(3, 15, 0), // 3 days from now at 3:00 PM
    status: MeetingStatus.CONFIRMED,
    meeting_type: MeetingType.DEMO,
    lead_id: 2,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    location: "Google Meet"
  },
  {
    id: 3,
    title: "Follow-up Discussion",
    description: "Follow up on previous meeting",
    start_time: createDateWithTime(7, 11, 0), // 7 days from now at 11:00 AM
    end_time: createDateWithTime(7, 12, 0), // 7 days from now at 12:00 PM
    status: MeetingStatus.SCHEDULED,
    meeting_type: MeetingType.FOLLOW_UP,
    lead_id: 3,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    location: "Phone Call"
  },
  // Add a meeting for tomorrow to test week view
  {
    id: 4,
    title: "Strategy Session",
    description: "Discuss marketing strategy",
    start_time: createDateWithTime(1, 13, 0), // Tomorrow at 1:00 PM
    end_time: createDateWithTime(1, 14, 30), // Tomorrow at 2:30 PM
    status: MeetingStatus.CONFIRMED,
    meeting_type: MeetingType.DISCOVERY,
    lead_id: 4,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    location: "Conference Room A"
  },
  // Add a meeting for today at a different time to test day view
  {
    id: 5,
    title: "Quick Check-in",
    description: "Brief status update",
    start_time: createDateWithTime(0, 15, 0), // Today at 3:00 PM
    end_time: createDateWithTime(0, 15, 30), // Today at 3:30 PM
    status: MeetingStatus.SCHEDULED,
    meeting_type: MeetingType.FOLLOW_UP,
    lead_id: 5,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    location: "Phone Call"
  }
];

// Create events for today and upcoming days
const createTestEvents = () => {
  const today = new Date();
  const events = [];
  
  // Event for today
  const todayEvent = {
    id: '101',
    title: 'Today\'s Meeting',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30).toISOString(),
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6'
  };
  events.push(todayEvent);
  
  // Event for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowEvent = {
    id: '102',
    title: 'Tomorrow\'s Meeting',
    start: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 14, 0).toISOString(),
    end: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 30).toISOString(),
    backgroundColor: '#10b981',
    borderColor: '#10b981'
  };
  events.push(tomorrowEvent);
  
  // Event for next week
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekEvent = {
    id: '103',
    title: 'Next Week Meeting',
    start: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 9, 0).toISOString(),
    end: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 10, 0).toISOString(),
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b'
  };
  events.push(nextWeekEvent);
  
  // Add another event for today at a different time
  const todayEvent2 = {
    id: '104',
    title: 'Afternoon Check-in',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0).toISOString(),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30).toISOString(),
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6'
  };
  events.push(todayEvent2);
  
  console.log('Created test events:', events);
  return events;
};

export function EnhancedCalendar() {
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>(
    window.innerWidth < 768 ? 'timeGridDay' : 'dayGridMonth'
  );
  const calendarRef = useRef<FullCalendar>(null);
  
  // Dialog states
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [showSMSDialog, setShowSMSDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showNoShowDialog, setShowNoShowDialog] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [noShowReason, setNoShowReason] = useState('');

  // Function to change calendar view
  const changeView = (newView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
    setCurrentView(newView);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(newView);
    }
  };
  
  // Handle event click
  const handleEventClick = (clickInfo: EventClickArg) => {
    console.log('Event clicked:', clickInfo.event);
    setSelectedMeeting({
      id: parseInt(clickInfo.event.id),
      title: clickInfo.event.title,
      start_time: clickInfo.event.start?.toISOString() || new Date().toISOString(),
      end_time: clickInfo.event.end?.toISOString() || new Date().toISOString(),
      description: clickInfo.event.extendedProps?.description || 'No description available',
      status: MeetingStatus.SCHEDULED,
      location: clickInfo.event.extendedProps?.location || 'No location specified',
      contact: {
        phone: '+1234567890',
        email: 'contact@example.com',
        name: 'John Doe'
      }
    });
    setShowMeetingDialog(true);
  };
  
  // Check for meetings that have passed without being joined
  useEffect(() => {
    const checkForMissedMeetings = () => {
      const now = new Date();
      
      // Get events from the calendar
      const calendarApi = calendarRef.current?.getApi();
      if (!calendarApi) return;
      
      const events = calendarApi.getEvents();
      
      events.forEach(event => {
        const meeting = event.extendedProps?.meeting;
        if (!meeting) return;
        
        const endTime = event.end || event.start;
        if (!endTime) return;
        
        // Check if meeting has ended and was not marked as joined or no-show
        if (isPast(endTime) && 
            meeting.status !== MeetingStatus.COMPLETED && 
            meeting.status !== MeetingStatus.NO_SHOW &&
            !meeting.joined) {
          
          // If meeting ended more than 15 minutes ago, mark as no-show
          if (differenceInMinutes(now, endTime) > 15) {
            console.log('Detected missed meeting:', meeting.title);
            
            // Update the meeting status in our local state
            const updatedMeeting = {
              ...meeting,
              status: MeetingStatus.NO_SHOW,
              updated_at: new Date().toISOString()
            };
            
            // Update the event properties
            event.setProp('backgroundColor', '#8b5cf6'); // Purple for no-show
            event.setExtendedProp('meeting', updatedMeeting);
            
            // Update lead timeline for no-show
            updateLeadTimelineForNoShow(updatedMeeting);
          }
        }
      });
    };
    
    // Check for missed meetings every 5 minutes
    const intervalId = setInterval(checkForMissedMeetings, 5 * 60 * 1000);
    
    // Run once on component mount
    checkForMissedMeetings();
    
    return () => clearInterval(intervalId);
  }, []);

  // Handle join meeting
  const handleJoinMeeting = () => {
    if (!selectedMeeting) return;
    
    let meetingUrl = '';
    
    // Extract meeting URL based on different platforms
    if (selectedMeeting.location) {
      // Check for direct URLs
      if (selectedMeeting.location.includes('http')) {
        meetingUrl = selectedMeeting.location;
      } 
      // Check for Zoom meeting ID
      else if (selectedMeeting.location.includes('zoom')) {
        const zoomIdMatch = selectedMeeting.location.match(/(\d{9,11})/);
        if (zoomIdMatch) {
          meetingUrl = `https://zoom.us/j/${zoomIdMatch[1]}`;
        } else {
          meetingUrl = 'https://zoom.us/join';
        }
      } 
      // Check for Google Meet
      else if (selectedMeeting.location.includes('meet')) {
        const meetCodeMatch = selectedMeeting.location.match(/([a-z0-9\-]{3,20})/i);
        if (meetCodeMatch) {
          meetingUrl = `https://meet.google.com/${meetCodeMatch[1]}`;
        } else {
          meetingUrl = 'https://meet.google.com/';
        }
      } 
      // Check for Skype
      else if (selectedMeeting.location.includes('skype')) {
        const skypeIdMatch = selectedMeeting.location.match(/([a-zA-Z0-9\.\:\_]+)/);
        if (skypeIdMatch) {
          meetingUrl = `https://web.skype.com/call/${skypeIdMatch[1]}`;
        } else {
          meetingUrl = 'https://web.skype.com/';
        }
      } 
      // Check for Microsoft Teams
      else if (selectedMeeting.location.includes('teams')) {
        meetingUrl = 'https://teams.microsoft.com/';
      }
    }
    
    if (meetingUrl) {
      // Mark the meeting as joined
      const updatedMeeting = {
        ...selectedMeeting,
        joined: true,
        join_time: new Date().toISOString()
      };
      
      // Update the meeting in our local state
      if (calendarRef.current) {
        const event = calendarRef.current.getApi().getEventById(selectedMeeting.id.toString());
        if (event) {
          event.setExtendedProp('meeting', updatedMeeting);
        }
      }
      
      // Update lead timeline
      updateLeadTimeline(updatedMeeting);
      
      // Open meeting URL
      window.open(meetingUrl, '_blank');
    } else {
      toast({
        title: "Cannot join meeting",
        description: "This meeting does not have a valid virtual location.",
        variant: "destructive",
      });
    }
  };
  
  // Update lead timeline when joining a meeting
  const updateLeadTimeline = (meeting: any) => {
    try {
      // In a real implementation, this would make an API call to update the lead timeline
      console.log('Updating lead timeline for meeting:', meeting.id);
      
      // Create a timeline entry
      const timelineEntry = {
        lead_id: meeting.lead_id || meeting.contact?.id,
        activity_type: 'meeting_joined',
        description: `Joined meeting: ${meeting.title}`,
        timestamp: new Date().toISOString(),
        user_id: 1, // Current user ID
        metadata: {
          meeting_id: meeting.id,
          meeting_title: meeting.title,
          meeting_time: meeting.start_time,
          meeting_status: meeting.status
        }
      };
      
      console.log('Timeline entry created:', timelineEntry);
      
      // Show success message
      toast({
        title: "Meeting joined",
        description: "This activity has been added to the lead timeline.",
      });
    } catch (error) {
      console.error('Error updating lead timeline:', error);
    }
  };
  
  // Update lead timeline for no-show
  const updateLeadTimelineForNoShow = (meeting: any) => {
    try {
      // In a real implementation, this would make an API call to update the lead timeline
      console.log('Updating lead timeline for no-show meeting:', meeting.id);
      
      // Create a timeline entry
      const timelineEntry = {
        lead_id: meeting.lead_id || meeting.contact?.id,
        activity_type: 'meeting_no_show',
        description: `Lead did not attend meeting: ${meeting.title}`,
        timestamp: new Date().toISOString(),
        user_id: 1, // Current user ID
        metadata: {
          meeting_id: meeting.id,
          meeting_title: meeting.title,
          meeting_time: meeting.start_time,
          meeting_status: meeting.status,
          no_show_reason: meeting.no_show_reason
        }
      };
      
      console.log('Timeline entry created for no-show:', timelineEntry);
    } catch (error) {
      console.error('Error updating lead timeline for no-show:', error);
    }
  };
  
  // Handle manually marking a meeting as no-show
  const handleMarkNoShow = () => {
    if (!selectedMeeting) return;
    setNoShowReason('');
    setShowNoShowDialog(true);
  };
  
  // Handle submitting no-show reason
  const handleSubmitNoShow = () => {
    if (!selectedMeeting) return;
    
    // Update the meeting status
    const updatedMeeting = {
      ...selectedMeeting,
      status: MeetingStatus.NO_SHOW,
      updated_at: new Date().toISOString(),
      no_show_reason: noShowReason || 'No reason provided'
    };
    
    // Update the meeting in our local state
    if (calendarRef.current) {
      const event = calendarRef.current.getApi().getEventById(selectedMeeting.id.toString());
      if (event) {
        event.setProp('backgroundColor', '#8b5cf6'); // Purple for no-show
        event.setExtendedProp('meeting', updatedMeeting);
      }
    }
    
    // Update lead timeline
    updateLeadTimelineForNoShow(updatedMeeting);
    
    toast({
      title: "Meeting marked as no-show",
      description: "The lead timeline has been updated.",
    });
    
    setShowNoShowDialog(false);
    setShowMeetingDialog(false);
  };

  // Handle cancel meeting
  const handleCancelMeeting = () => {
    toast({
      title: "Meeting canceled",
      description: "The meeting has been successfully canceled.",
    });
    setShowMeetingDialog(false);
  };

  // Handle reschedule meeting
  const handleRescheduleMeeting = () => {
    toast({
      title: "Reschedule meeting",
      description: "Opening reschedule dialog...",
    });
    // In a real app, this would open a scheduling dialog
    setShowScheduleDialog(true);
  };

  // Handle call contact
  const handleCallContact = () => {
    if (selectedMeeting?.contact?.phone) {
      setShowCallDialog(true);
    } else {
      toast({
        title: "No phone number",
        description: "This contact does not have a phone number.",
        variant: "destructive",
      });
    }
  };

  // Handle send SMS
  const handleSendSMS = () => {
    if (selectedMeeting?.contact?.phone) {
      setMessageText('');
      setShowSMSDialog(true);
    } else {
      toast({
        title: "No phone number",
        description: "This contact does not have a phone number.",
        variant: "destructive",
      });
    }
  };

  // Handle send email
  const handleSendEmail = () => {
    if (selectedMeeting?.contact?.email) {
      setEmailSubject(`Regarding our meeting on ${format(parseISO(selectedMeeting.start_time), 'MMMM d, yyyy')}`);
      setEmailBody('');
      setShowEmailDialog(true);
    } else {
      toast({
        title: "No email address",
        description: "This contact does not have an email address.",
        variant: "destructive",
      });
    }
  };

  // Handle submit call
  const handleSubmitCall = () => {
    toast({
      title: "Calling contact",
      description: `Initiating call to ${selectedMeeting.contact.name} at ${selectedMeeting.contact.phone}`,
    });
    setShowCallDialog(false);
  };

  // Handle submit SMS
  const handleSubmitSMS = () => {
    if (!messageText.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Message sent",
      description: `SMS sent to ${selectedMeeting.contact.name}`,
    });
    setShowSMSDialog(false);
  };

  // Handle submit email
  const handleSubmitEmail = () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast({
        title: "Incomplete email",
        description: "Please enter both subject and message.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Email sent",
      description: `Email sent to ${selectedMeeting.contact.name}`,
    });
    setShowEmailDialog(false);
  };

  // Function to handle scheduling a new meeting
  const handleScheduleMeeting = () => {
    setShowScheduleDialog(true);
  };
  
  // Function to handle the success of scheduling a new meeting
  const handleScheduleSuccess = () => {
    setShowScheduleDialog(false);
    // In a real app, we would refresh the events here
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Enhanced Meeting Calendar</h3>
          <div className="flex items-center space-x-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={currentView === 'dayGridMonth' ? 'default' : 'outline'}
                size="sm"
                onClick={() => changeView('dayGridMonth')}
                className="hidden md:inline-flex"
              >
                Month
              </Button>
              <Button
                variant={currentView === 'timeGridWeek' ? 'default' : 'outline'}
                size="sm"
                onClick={() => changeView('timeGridWeek')}
                className="hidden sm:inline-flex"
              >
                Week
              </Button>
              <Button
                variant={currentView === 'timeGridDay' ? 'default' : 'outline'}
                size="sm"
                onClick={() => changeView('timeGridDay')}
              >
                Day
              </Button>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleScheduleMeeting}
              className="ml-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Meeting
            </Button>
          </div>
        </div>

        <div className="h-[700px]">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={currentView}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            events={createTestEvents()}
            eventClick={handleEventClick}
            height="100%"
            nowIndicator={true}
            dayMaxEvents={true}
            weekends={true}
            navLinks={true}
            editable={false}
            selectable={false}
          />
        </div>
      </div>

      {/* Meeting Details Dialog */}
      <Dialog open={showMeetingDialog} onOpenChange={setShowMeetingDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Meeting Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedMeeting && (
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">{selectedMeeting.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{selectedMeeting.description}</p>
                <div className="flex items-center text-sm mb-1">
                  <Clock className="mr-2 h-4 w-4 opacity-70" />
                  <span>
                    {format(parseISO(selectedMeeting.start_time), 'EEEE, MMMM d, yyyy')} at {format(parseISO(selectedMeeting.start_time), 'h:mm a')}
                  </span>
                </div>
                {selectedMeeting.location && (
                  <div className="flex items-center text-sm mb-3">
                    <MapPin className="mr-2 h-4 w-4 opacity-70" />
                    <span>{selectedMeeting.location}</span>
                  </div>
                )}
                
                {/* Contact information */}
                {selectedMeeting.contact && (
                  <div className="mt-3 pt-3 border-t">
                    <h4 className="font-medium mb-2">Contact Information</h4>
                    <div className="text-sm">{selectedMeeting.contact.name}</div>
                    {selectedMeeting.contact.phone && (
                      <div className="text-sm">{selectedMeeting.contact.phone}</div>
                    )}
                    {selectedMeeting.contact.email && (
                      <div className="text-sm">{selectedMeeting.contact.email}</div>
                    )}
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
                  {/* Primary actions */}
                  <div className="flex flex-wrap gap-2 mb-2 w-full">
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleJoinMeeting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Video className="h-4 w-4 mr-1" />
                      Join Meeting
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRescheduleMeeting}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Reschedule
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleCancelMeeting}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel Meeting
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleMarkNoShow}
                      className="border-purple-500 text-purple-700 hover:bg-purple-50"
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Mark as No-Show
                    </Button>
                  </div>
                  
                  {/* Communication actions */}
                  <div className="flex flex-wrap gap-2 w-full">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCallContact}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSendSMS}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Send SMS
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSendEmail}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Send Email
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Schedule New Meeting
            </DialogTitle>
          </DialogHeader>
          
          <EnhancedMeetingForm 
            onSuccess={handleScheduleSuccess}
            onCancel={() => setShowScheduleDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Call Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Call Contact</DialogTitle>
            <DialogDescription>
              Initiate a call to this contact.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMeeting?.contact && (
            <div className="py-4">
              <div className="space-y-2">
                <div className="font-medium">{selectedMeeting.contact.name}</div>
                <div className="text-sm text-muted-foreground">{selectedMeeting.contact.phone}</div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCallDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitCall}>Call Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SMS Dialog */}
      <Dialog open={showSMSDialog} onOpenChange={setShowSMSDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send SMS</DialogTitle>
            <DialogDescription>
              Send a text message to this contact.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMeeting?.contact && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <div className="font-medium">{selectedMeeting.contact.name}</div>
                <div className="text-sm text-muted-foreground">{selectedMeeting.contact.phone}</div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Type your message here..." 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSMSDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitSMS}>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send an email to this contact.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMeeting?.contact && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <div className="font-medium">{selectedMeeting.contact.name}</div>
                <div className="text-sm text-muted-foreground">{selectedMeeting.contact.email}</div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  placeholder="Email subject" 
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea 
                  id="body" 
                  placeholder="Type your email message here..." 
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitEmail}>Send Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No-Show Dialog */}
      <Dialog open={showNoShowDialog} onOpenChange={setShowNoShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as No-Show</DialogTitle>
            <DialogDescription>
              Record that the lead did not attend this meeting.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMeeting && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <div className="font-medium">{selectedMeeting.title}</div>
                <div className="text-sm text-muted-foreground">
                  {format(parseISO(selectedMeeting.start_time), 'EEEE, MMMM d, yyyy')} at {format(parseISO(selectedMeeting.start_time), 'h:mm a')}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="noShowReason">Reason for No-Show (Optional)</Label>
                <Textarea 
                  id="noShowReason" 
                  placeholder="Enter the reason why the lead didn't attend..." 
                  value={noShowReason}
                  onChange={(e) => setNoShowReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoShowDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmitNoShow}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Mark as No-Show
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 