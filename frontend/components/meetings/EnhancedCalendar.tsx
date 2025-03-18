import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Meeting, MeetingStatus, MeetingType, MeetingContact } from '@/lib/types/meeting';
import { format, parseISO, isSameDay, addDays, isPast, differenceInMinutes } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Plus, User, Phone, Mail, MessageSquare, Video, Calendar, X, Edit, AlertTriangle, RefreshCw, Bug } from 'lucide-react';
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
import { getMeetings, updateMeeting, deleteMeeting } from '@/lib/api/meetings';
import { getLeads } from '@/lib/api/leads';
import { USE_MOCK_DATA } from '@/lib/config';
import { ApiResponse, ApiError } from '@/lib/api/apiClient';
import { Lead, LeadSource, LeadStatus } from '@/lib/types/lead';
import { TimeSlot } from '@/lib/services/aiMeetingService';
import { EnhancedMeetingDetails } from './EnhancedMeetingDetails';
import { PhoneDialog } from '../communications/PhoneDialog';
import { EmailDialog } from '../communications/EmailDialog';
import { enableMockDataMode } from '@/lib/utils/mockDataUtils';

// FullCalendar imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, DateSelectArg, EventInput } from '@fullcalendar/core';

// Import the new context
import { EnhancedMeetingDetailsProvider, EnhancedMeetingDetailsContainer, useEnhancedMeetingDetails } from '@/lib/contexts/EnhancedMeetingDetailsContext';
import { useMeetingDialog, MeetingDialogType, MeetingDialogProvider } from '@/contexts/MeetingDialogContext';
import { ContextualEnhancedMeetingDetails } from '@/components/meetings/ContextualEnhancedMeetingDetails';
import { MeetingDialogContainer } from '@/components/ui/meeting-dialog';
import { MeetingDialogTaskbar } from '@/components/ui/meeting-dialog-taskbar';

// Extended Meeting type that includes the contact property
interface ExtendedMeeting extends Meeting {
  contact?: MeetingContact;
}

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
    id: "1",
    title: "Initial Client Meeting",
    description: "Discuss project requirements and timeline",
    start_time: createDateWithTime(0, 10, 0), // Today at 10:00 AM
    end_time: createDateWithTime(0, 11, 30), // Today at 11:30 AM
    status: MeetingStatus.SCHEDULED,
    meeting_type: MeetingType.INITIAL_CALL,
    lead_id: "1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    location: "Zoom Meeting"
  },
  {
    id: "2",
    title: "Product Demo",
    description: "Demonstrate product features",
    start_time: createDateWithTime(3, 14, 0), // 3 days from now at 2:00 PM
    end_time: createDateWithTime(3, 15, 0), // 3 days from now at 3:00 PM
    status: MeetingStatus.SCHEDULED,
    meeting_type: MeetingType.DEMO,
    lead_id: "2",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    location: "Google Meet"
  },
  {
    id: "3",
    title: "Follow-up Discussion",
    description: "Follow up on previous meeting",
    start_time: createDateWithTime(7, 11, 0), // 7 days from now at 11:00 AM
    end_time: createDateWithTime(7, 12, 0), // 7 days from now at 12:00 PM
    status: MeetingStatus.SCHEDULED,
    meeting_type: MeetingType.FOLLOW_UP,
    lead_id: "3",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    location: "Phone Call"
  },
  // Add a meeting for tomorrow to test week view
  {
    id: "4",
    title: "Strategy Session",
    description: "Discuss marketing strategy",
    start_time: createDateWithTime(1, 13, 0), // Tomorrow at 1:00 PM
    end_time: createDateWithTime(1, 14, 30), // Tomorrow at 2:30 PM
    status: MeetingStatus.SCHEDULED,
    meeting_type: MeetingType.DISCOVERY,
    lead_id: "4",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    location: "Conference Room A"
  },
  // Add a meeting for today at a different time to test day view
  {
    id: "5",
    title: "Quick Check-in",
    description: "Brief status update",
    start_time: createDateWithTime(0, 15, 0), // Today at 3:00 PM
    end_time: createDateWithTime(0, 15, 30), // Today at 3:30 PM
    status: MeetingStatus.SCHEDULED,
    meeting_type: MeetingType.FOLLOW_UP,
    lead_id: "5",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    location: "Phone Call"
  }
];

// Fix the mock leads array to match the Lead type
const MOCK_LEADS: Lead[] = [
  {
    id: "1",
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "555-123-4567",
    company: "ABC Corp",
    job_title: "CEO",
    source: LeadSource.WEBSITE,
    status: LeadStatus.NEW,
    created_at: "2025-03-05T07:24:09.193Z",
    updated_at: "2025-03-09T05:39:08.508Z",
    notes: "Interested in our premium plan"
  },
  {
    id: "2",
    first_name: "Jane",
    last_name: "Smith",
    email: "jane.smith@example.com",
    phone: "555-987-6543",
    company: "XYZ Inc",
    job_title: "CTO",
    source: LeadSource.REFERRAL,
    status: LeadStatus.QUALIFIED,
    created_at: "2025-03-05T07:24:09.193Z",
    updated_at: "2025-03-09T05:39:08.508Z",
    notes: "Ready for a product demo"
  },
  {
    id: "3",
    first_name: "Robert",
    last_name: "Johnson",
    email: "robert@example.com",
    phone: "555-555-5555",
    company: "Johnson LLC",
    job_title: "Director",
    source: LeadSource.SOCIAL_MEDIA,
    status: LeadStatus.CONTACTED,
    created_at: "2025-03-05T07:24:09.193Z",
    updated_at: "2025-03-09T05:39:08.508Z",
    notes: "Follow up next week"
  },
  {
    id: "4",
    first_name: "Sarah",
    last_name: "Williams",
    email: "sarah@example.com",
    phone: "555-444-3333",
    company: "Williams Co",
    job_title: "Marketing Manager",
    source: LeadSource.EMAIL_CAMPAIGN,
    status: LeadStatus.PROPOSAL,
    created_at: "2025-03-05T07:24:09.193Z",
    updated_at: "2025-03-09T05:39:08.508Z",
    notes: "Interested in our enterprise solution"
  },
  {
    id: "5",
    first_name: "Michael",
    last_name: "Brown",
    email: "michael@example.com",
    phone: "555-222-1111",
    company: "Brown Industries",
    job_title: "Sales Director",
    source: LeadSource.EVENT,
    status: LeadStatus.NEGOTIATION,
    created_at: "2025-03-05T07:24:09.193Z",
    updated_at: "2025-03-09T05:39:08.508Z",
    notes: "Discussing contract terms"
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

// Wrapper component that adds the context provider
export function EnhancedCalendarWithProvider() {
  console.log('🔍🔍 PROVIDER: Rendering EnhancedCalendarWithProvider');
  
  return (
    <MeetingDialogProvider>
      <EnhancedMeetingDetailsProvider>
        <EnhancedCalendar />
        <EnhancedMeetingDetailsContainer />
        <MeetingDialogContainer />
        <MeetingDialogTaskbar />
      </EnhancedMeetingDetailsProvider>
    </MeetingDialogProvider>
  );
}

export function EnhancedCalendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<ExtendedMeeting | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showNoShowForm, setShowNoShowForm] = useState(false);
  const [noShowNotes, setNoShowNotes] = useState('');
  const [showCallForm, setShowCallForm] = useState(false);
  const [showSMSForm, setShowSMSForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [smsMessage, setSMSMessage] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [useMockData, setUseMockData] = useState(process.env.NODE_ENV === 'development');
  
  // Add state for phone and email dialogs
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  
  // Get the dialog context
  const meetingDialog = useMeetingDialog();
  
  console.log('🔍🔍 CALENDAR: EnhancedCalendar component rendered with dialog context:', {
    isHookAvailable: !!meetingDialog,
    hasOpenMethod: !!meetingDialog.openMeetingDialog,
    dialogsCount: meetingDialog.dialogs?.length || 0
  });

  // Fetch meetings from API
  const fetchMeetings = async (retryCount = 0, maxRetries = 3) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching meetings from API for EnhancedCalendar');
      
      // In development mode, use mock data by default to avoid authentication issues
      if (useMockData) {
        console.log('Using mock meeting data');
        setMeetings(MOCK_MEETINGS);
        setLoading(false);
        return;
      }
      
      // Add a timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timed out after 15 seconds'));
        }, 15000); // 15 seconds timeout as a fallback
      });
      
      // Race the API call against the timeout
      try {
        const response = await Promise.race([
          getMeetings(),
          timeoutPromise
        ]);
        
        // Check if response is an ApiResponse object with data property
        if (response && typeof response === 'object' && 'data' in response) {
          const apiResponse = response as unknown as ApiResponse<Meeting[]>;
          if (apiResponse.error) {
            // Improved error logging with more details
            console.error('Error fetching meetings:', 
              apiResponse.error.message || 
              (apiResponse.error as ApiError).code || 
              JSON.stringify(apiResponse.error) || 
              'Unknown error'
            );
            
            // Set a more descriptive error message
            let errorMessage = apiResponse.error.message;
            
            // Handle specific error codes
            if ((apiResponse.error as ApiError).code === 'NETWORK_ERROR') {
              errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection and try again.';
              
              // Retry logic for network errors
              if (retryCount < maxRetries) {
                console.log(`Network error, retrying (${retryCount + 1}/${maxRetries})...`);
                setLoading(false);
                
                // Show retry toast
                toast({
                  title: 'Connection Issue',
                  description: `Retrying to connect (${retryCount + 1}/${maxRetries})...`,
                  variant: 'default',
                });
                
                // Wait before retrying (exponential backoff)
                setTimeout(() => {
                  fetchMeetings(retryCount + 1, maxRetries);
                }, Math.min(1000 * Math.pow(2, retryCount), 8000)); // Exponential backoff with max 8 seconds
                return;
              }
            } else if ((apiResponse.error as ApiError).code === 'TIMEOUT_ERROR') {
              errorMessage = 'Request timed out. The server is taking too long to respond. Please try again later.';
            } else if ('code' in apiResponse.error && apiResponse.error.code === 'AUTH_REQUIRED') {
              errorMessage = 'Authentication required. Please log in again.';
              
              // Redirect to login page if not authenticated
              if (typeof window !== 'undefined') {
                toast({
                  title: 'Authentication Error',
                  description: 'Your session has expired. Please log in again.',
                  variant: 'destructive',
                });
                
                // Use a small delay to allow the toast to be shown
                setTimeout(() => {
                  window.location.href = '/auth/login';
                }, 2000);
                return;
              }
            } else if (Object.keys(apiResponse.error).length === 0) {
              errorMessage = 'Authentication error - please log in again';
              
              // Redirect to login page if not authenticated
              if (typeof window !== 'undefined') {
                toast({
                  title: 'Authentication Error',
                  description: 'Your session has expired. Please log in again.',
                  variant: 'destructive',
                });
                
                // Use a small delay to allow the toast to be shown
                setTimeout(() => {
                  window.location.href = '/auth/login';
                }, 2000);
                return;
              }
            } else if (!errorMessage) {
              errorMessage = 'Failed to fetch meetings';
            }
            
            setError(errorMessage);
            
            // Fall back to mock data if API fails
            console.log('Using mock meeting data due to API error');
            setMeetings(MOCK_MEETINGS);
            
            toast({
              title: 'Error',
              description: 'Failed to load meetings, using cached data',
              variant: 'destructive',
            });
            return;
          }
          
          // Ensure data is an array
          const meetingsData = Array.isArray(apiResponse.data) ? apiResponse.data : [];
          console.log('Meetings data from API:', meetingsData);
          
          // Cache the successful response in localStorage
          try {
            localStorage.setItem('cachedMeetings', JSON.stringify(meetingsData));
            localStorage.setItem('meetingsCacheTimestamp', Date.now().toString());
          } catch (cacheError) {
            console.warn('Failed to cache meetings data:', cacheError);
          }
          
          setMeetings(meetingsData);
          
          toast({
            title: 'Success',
            description: 'Meetings loaded successfully',
          });
        } else if (Array.isArray(response)) {
          // If response is already an array, use it directly
          console.log('Meetings array from API:', response);
          
          // Cache the successful response
          try {
            localStorage.setItem('cachedMeetings', JSON.stringify(response));
            localStorage.setItem('meetingsCacheTimestamp', Date.now().toString());
          } catch (cacheError) {
            console.warn('Failed to cache meetings data:', cacheError);
          }
          
          setMeetings(response);
          
          toast({
            title: 'Success',
            description: 'Meetings loaded successfully',
          });
        } else {
          // If response is neither an ApiResponse nor an array, log and use empty array
          console.error('Unexpected response format:', response);
          setError('Received unexpected data format from API');
          
          // Try to use cached data first before falling back to mock data
          const cachedData = loadCachedMeetings();
          if (cachedData.length > 0) {
            setMeetings(cachedData);
            toast({
              title: 'Warning',
              description: 'Using cached meeting data due to API format error',
              variant: 'default',
            });
          } else {
            setMeetings(MOCK_MEETINGS);
            toast({
              title: 'Error',
              description: 'Received unexpected data format from API, using mock data',
              variant: 'destructive',
            });
          }
        }
      } catch (timeoutError) {
        // Handle timeout separately for better error messages
        console.error('Timeout error:', timeoutError);
        
        // Retry logic for timeout errors
        if (retryCount < maxRetries) {
          console.log(`Timeout error, retrying (${retryCount + 1}/${maxRetries})...`);
          setLoading(false);
          
          toast({
            title: 'Request Timeout',
            description: `Retrying (${retryCount + 1}/${maxRetries})...`,
            variant: 'default',
          });
          
          // Wait before retrying (exponential backoff)
          setTimeout(() => {
            fetchMeetings(retryCount + 1, maxRetries);
          }, Math.min(1000 * Math.pow(2, retryCount), 8000));
          return;
        }
        
        setError('Request timed out. The server is taking too long to respond. Please try again later.');
        
        // Try to use cached data first before falling back to mock data
        const cachedData = loadCachedMeetings();
        if (cachedData.length > 0) {
          setMeetings(cachedData);
          toast({
            title: 'Warning',
            description: 'Using cached meeting data due to timeout',
            variant: 'default',
          });
        } else {
          setMeetings(MOCK_MEETINGS);
          toast({
            title: 'Error',
            description: 'Request timed out, using mock data',
            variant: 'destructive',
          });
        }
      }
    } catch (err: any) {
      // Improved error handling for exceptions
      console.error('Error in fetchMeetings:', err);
      
      // Set a more descriptive error message based on the error type
      let errorMessage = '';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Check for timeout errors
        if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          errorMessage = 'Request timed out. The server is taking too long to respond. Please try again later.';
        }
      } else if (typeof err === 'object' && err !== null) {
        if (Object.keys(err).length === 0) {
          errorMessage = 'Authentication error - please log in again';
        } else {
          errorMessage = JSON.stringify(err);
        }
      } else {
        errorMessage = 'An unexpected error occurred. Please try again later.';
      }
          
      setError(errorMessage);
      
      // Try to use cached data first before falling back to mock data
      const cachedData = loadCachedMeetings();
      if (cachedData.length > 0) {
        setMeetings(cachedData);
        toast({
          title: 'Warning',
          description: 'Using cached meeting data due to error',
          variant: 'default',
        });
      } else {
        // Fall back to mock data if there's an exception
        console.log('Using mock meeting data due to exception');
        setMeetings(MOCK_MEETINGS);
        
        toast({
          title: 'Error',
          description: 'Failed to load meetings, using mock data',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to load cached meetings
  const loadCachedMeetings = (): Meeting[] => {
    try {
      const cachedData = localStorage.getItem('cachedMeetings');
      const cacheTimestamp = localStorage.getItem('meetingsCacheTimestamp');
      
      if (cachedData && cacheTimestamp) {
        // Check if cache is less than 24 hours old
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        const cacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (cacheAge < cacheMaxAge) {
          const parsedData = JSON.parse(cachedData) as Meeting[];
          console.log('Using cached meeting data, cache age:', Math.round(cacheAge / (60 * 1000)), 'minutes');
          return parsedData;
        } else {
          console.log('Cached meeting data is too old, not using');
          return [];
        }
      }
    } catch (error) {
      console.warn('Error loading cached meetings:', error);
    }
    
    return [];
  };

  // Fetch leads
  useEffect(() => {
    const fetchLeads = async () => {
      setIsLoadingLeads(true);
      try {
        // In development mode, use mock data by default to avoid authentication issues
        if (useMockData) {
          console.log('Using mock lead data');
          setLeads(MOCK_LEADS as any);
          setIsLoadingLeads(false);
          return;
        }
        
        // Try to fetch leads from API
        const { data, error } = await getLeads();
        
        if (error) {
          console.error('Error fetching leads:', error);
          
          // Check if it's an authentication error
          if ('code' in error && error.code === 'AUTH_REQUIRED') {
            toast({
              title: 'Authentication Error',
              description: 'Your session has expired. Please log in again.',
              variant: 'destructive',
            });
            
            // Redirect to login page after a short delay
            setTimeout(() => {
              window.location.href = '/auth/login';
            }, 2000);
            return;
          }
          
          toast({
            title: 'Error',
            description: 'Failed to load contacts, using mock data',
            variant: 'destructive',
          });
          
          // Fallback to mock data on error
          setLeads(MOCK_LEADS as any);
        } else if (data) {
          // Use the data from the API
          setLeads(data as any);
        } else {
          // Fallback to mock data if no data and no error
          console.log('No data returned from API, using mock lead data');
          setLeads(MOCK_LEADS as any);
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
        toast({
          title: 'Error',
          description: 'Failed to load contacts, using mock data',
          variant: 'destructive',
        });
        
        // Fallback to mock data on error
        setLeads(MOCK_LEADS as any);
      } finally {
        setIsLoadingLeads(false);
      }
    };
    
    fetchLeads();
  }, [useMockData]);

  // Call fetchMeetings when the component mounts
  useEffect(() => {
    fetchMeetings();
  }, [useMockData]);

  // Handle refresh button click
  const handleRefresh = () => {
    fetchMeetings();
    toast({
      title: "Refreshed",
      description: "Calendar data has been refreshed",
    });
  };

  // Dialog states
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // Function to change calendar view
  const changeView = (newView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
    setCurrentView(newView);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(newView);
    }
  };
  
  // Handle event click
  const handleEventClick = (clickInfo: EventClickArg) => {
    console.log('⭐⭐⭐ EVENT CLICKED: Using REACT CONTEXT Dialog approach only');
    
    // Get the lead_id from the event
    const leadId = clickInfo.event.extendedProps?.lead_id || "1";
    
    // Find the lead in the leads array
    const lead = leads.find(lead => lead.id === leadId);
    
    // Create a complete Meeting object with all required properties
    const meetingData: ExtendedMeeting = {
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start_time: clickInfo.event.start?.toISOString() || new Date().toISOString(),
      end_time: clickInfo.event.end?.toISOString() || new Date().toISOString(),
      description: clickInfo.event.extendedProps?.description || 'No description available',
      status: MeetingStatus.SCHEDULED,
      location: clickInfo.event.extendedProps?.location || 'No location specified',
      meeting_type: clickInfo.event.extendedProps?.meeting_type || MeetingType.OTHER,
      lead_id: leadId,
      created_at: clickInfo.event.extendedProps?.created_at || new Date().toISOString(),
      updated_at: clickInfo.event.extendedProps?.updated_at || new Date().toISOString(),
      agenda_items: clickInfo.event.extendedProps?.agenda_items || [],
      // Add contact information
      contact: {
        phone: clickInfo.event.extendedProps?.contact_phone || '+1234567890',
        email: clickInfo.event.extendedProps?.contact_email || 'contact@example.com',
        name: clickInfo.event.extendedProps?.contact_name || 'John Doe'
      },
      lead: lead
    };
    
    // Set the selected meeting
    setSelectedMeeting(meetingData);
    
    // USING REACT CONTEXT DIALOG ONLY
    const dialogId = `meeting-details-${meetingData.id}`;
    console.log('⭐⭐⭐ CALENDAR: Creating dialog with React Context, ID:', dialogId);
    
    const dialogContent = (
      <ContextualEnhancedMeetingDetails
        dialogId={dialogId}
        meeting={meetingData}
        onClose={() => {
          console.log('⭐⭐⭐ CALENDAR: React Context dialog closed via onClose callback');
          // Refresh meetings after update to ensure the calendar is updated
          fetchMeetings();
        }}
      />
    );
    
    console.log('⭐⭐⭐ CALENDAR: Opening dialog with React Context, ID:', dialogId);
    const contextResult = meetingDialog.openMeetingDialog(dialogId, MeetingDialogType.DETAILS, dialogContent, { meeting: meetingData });
    console.log('⭐⭐⭐ CALENDAR: Result of React Context dialog open:', contextResult);
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
    setNoShowNotes('');
    setShowNoShowForm(true);
  };
  
  // Handle submitting no-show reason
  const handleSubmitNoShow = () => {
    if (!selectedMeeting) return;
    
    // Update the meeting status
    const updatedMeeting = {
      ...selectedMeeting,
      status: MeetingStatus.NO_SHOW,
      updated_at: new Date().toISOString(),
      no_show_reason: noShowNotes || 'No reason provided'
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
    
    setShowNoShowForm(false);
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
      setShowCallForm(true);
    } else {
      toast({
        title: "No phone number",
        description: "This contact doesn't have a phone number.",
        variant: "destructive",
      });
    }
  };

  // Handle send SMS
  const handleSendSMS = () => {
    if (selectedMeeting?.contact?.phone) {
      setSMSMessage('');
      setShowSMSForm(true);
    } else {
      toast({
        title: "No phone number",
        description: "This contact doesn't have a phone number.",
        variant: "destructive",
      });
    }
  };

  // Handle send email
  const handleSendEmail = () => {
    if (selectedMeeting?.contact?.email) {
      setShowEmailForm(true);
    } else {
      toast({
        title: "No email address",
        description: "This contact doesn't have an email address.",
        variant: "destructive",
      });
    }
  };

  // Handle submit call
  const handleSubmitCall = (callData: { phoneNumber: string; duration: number; notes: string }) => {
    toast({
      title: "Call completed",
      description: `Call to ${selectedMeeting?.contact?.name} completed successfully.`,
    });
    setShowCallForm(false);
  };

  // Handle submit email
  const handleSubmitEmail = (emailData: { to: string; subject: string; body: string }) => {
    toast({
      title: "Email sent",
      description: `Email sent to ${selectedMeeting?.contact?.name} successfully.`,
    });
    setShowEmailForm(false);
  };

  // Handle submit SMS
  const handleSubmitSMS = () => {
    if (!smsMessage.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedMeeting?.contact?.phone) {
      toast({
        title: "Error",
        description: "Contact information is missing",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Message sent",
      description: `SMS sent to ${selectedMeeting?.contact?.name}`,
    });
    setShowSMSForm(false);
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

  // Handle opening the phone dialog
  const handleOpenPhoneDialog = () => {
    if (selectedMeeting?.lead?.phone) {
      setShowPhoneDialog(true);
    } else {
      toast({
        title: "No phone number",
        description: "This lead doesn't have a phone number.",
        variant: "destructive",
      });
    }
  };
  
  // Handle opening the email dialog
  const handleOpenEmailDialog = () => {
    if (selectedMeeting?.lead?.email) {
      setShowEmailDialog(true);
    } else {
      toast({
        title: "No email address",
        description: "This lead doesn't have an email address.",
        variant: "destructive",
      });
    }
  };
  
  // Handle phone call success
  const handlePhoneCallSuccess = (callData: { phoneNumber: string; duration: number; notes: string }) => {
    console.log('Phone call completed:', callData);
    toast({
      title: "Call completed",
      description: `Call to ${callData.phoneNumber} completed (${callData.duration} seconds)`,
    });
    setShowPhoneDialog(false);
  };
  
  // Handle email success
  const handleEmailSuccess = (emailData: { to: string; subject: string; body: string }) => {
    console.log('Email sent:', emailData);
    toast({
      title: "Email sent",
      description: `Email to ${emailData.to} sent successfully`,
    });
    setShowEmailDialog(false);
  };

  // Add this near the calendar header or controls
  const renderRefreshButton = () => {
    return (
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            toast({
              title: 'Refreshing',
              description: 'Fetching the latest meetings data...',
            });
            fetchMeetings(0, 3); // Reset retry count and max retries
          }}
          className="ml-2"
          disabled={loading}
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Refresh
        </Button>
        
        {process.env.NODE_ENV === 'development' && (
          <Button
            variant={useMockData ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setUseMockData(!useMockData);
              toast({
                title: useMockData ? 'Using Real Data' : 'Using Mock Data',
                description: useMockData ? 'Switching to real API data...' : 'Switching to mock data...',
              });
              // Refresh data after toggling
              setTimeout(() => {
                fetchMeetings(0, 3);
              }, 100);
            }}
            className="ml-2"
          >
            <Bug className="h-4 w-4 mr-1" />
            {useMockData ? 'Using Mock Data' : 'Use Mock Data'}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold">Meetings Calendar</h2>
          {renderRefreshButton()}
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowScheduleForm(true)} className="flex items-center">
            <Plus className="h-4 w-4 mr-1" />
            Add Meeting
          </Button>
        </div>
      </div>
      
      {/* Error message display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fetchMeetings(0, 3)}
            className="hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      )}
      
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

      {/* Schedule Meeting Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
          </DialogHeader>
          <EnhancedMeetingForm
            leadOptions={leads}
            initialTimeSlot={selectedTimeSlot}
            onSuccess={handleScheduleSuccess}
            onCancel={() => setShowScheduleDialog(false)}
            onCallContact={(lead) => {
              setShowScheduleDialog(false);
              // Create a temporary meeting object with the lead as contact
              const tempMeeting = {
                contact: {
                  name: `${lead.first_name} ${lead.last_name}`,
                  phone: lead.phone,
                  email: lead.email
                }
              };
              setSelectedMeeting(tempMeeting as any);
              setTimeout(() => {
                // Make sure the dialog has a title
                setCallNotes('');
                setShowCallForm(true);
              }, 100);
            }}
            onSendEmail={(lead) => {
              setShowScheduleDialog(false);
              // Create a temporary meeting object with the lead as contact
              const tempMeeting = {
                contact: {
                  name: `${lead.first_name} ${lead.last_name}`,
                  phone: lead.phone,
                  email: lead.email
                },
                start_time: new Date().toISOString() // Use current date for email subject
              };
              setSelectedMeeting(tempMeeting as any);
              setTimeout(() => {
                // Make sure the dialog has a title and subject
                setEmailSubject(`Follow-up with ${lead.first_name} ${lead.last_name}`);
                setEmailBody('');
                setShowEmailForm(true);
              }, 100);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Call Dialog */}
      <PhoneDialog 
        open={showCallForm} 
        onOpenChange={setShowCallForm}
        leadPhone={selectedMeeting?.contact?.phone || ''}
        leadName={selectedMeeting?.contact?.name || 'Contact'}
        onSuccess={handleSubmitCall}
      />

      {/* Email Dialog */}
      <EmailDialog
        open={showEmailForm}
        onOpenChange={setShowEmailForm}
        leadEmail={selectedMeeting?.contact?.email || ''}
        leadName={selectedMeeting?.contact?.name || 'Contact'}
        onSuccess={handleSubmitEmail}
      />

      {/* SMS Dialog */}
      <Dialog open={showSMSForm} onOpenChange={setShowSMSForm}>
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
                  value={smsMessage}
                  onChange={(e) => setSMSMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSMSForm(false)}>Cancel</Button>
            <Button onClick={handleSubmitSMS}>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No-Show Dialog */}
      <Dialog open={showNoShowForm} onOpenChange={setShowNoShowForm}>
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
                  {selectedMeeting.start_time ? 
                    `${format(parseISO(selectedMeeting.start_time), 'EEEE, MMMM d, yyyy')} at ${format(parseISO(selectedMeeting.start_time), 'h:mm a')}` : 
                    'Time not specified'}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="noShowNotes">Reason for No-Show (Optional)</Label>
                <Textarea 
                  id="noShowNotes" 
                  placeholder="Enter the reason why the lead didn't attend..." 
                  value={noShowNotes}
                  onChange={(e) => setNoShowNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoShowForm(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmitNoShow}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Mark as No-Show
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone Dialog */}
      {selectedMeeting && selectedMeeting.lead && (
        <PhoneDialog
          open={showPhoneDialog}
          onOpenChange={setShowPhoneDialog}
          leadPhone={selectedMeeting.lead.phone}
          leadName={`${selectedMeeting.lead.first_name} ${selectedMeeting.lead.last_name}`}
          onSuccess={handlePhoneCallSuccess}
        />
      )}
      
      {/* Email Dialog */}
      {selectedMeeting && selectedMeeting.lead && (
        <EmailDialog
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          leadEmail={selectedMeeting.lead.email || ''}
          leadName={`${selectedMeeting.lead.first_name} ${selectedMeeting.lead.last_name}`}
          onSuccess={handleEmailSuccess}
        />
      )}
    </div>
  );
} 