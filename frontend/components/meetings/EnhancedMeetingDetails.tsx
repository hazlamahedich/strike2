import { useState, useEffect, useRef } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import { 
  Clock, MapPin, User, Calendar, FileText, 
  CheckCircle, XCircle, MessageSquare, Sparkles,
  ClipboardList, Send, ListChecks, Phone, Mail, X, AlertTriangle, ArrowRight,
  Building, Tag, Paperclip, Download
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import RichTextEditor from '../communications/RichTextEditor';

import { Meeting, MeetingStatus, MeetingUpdate } from '@/lib/types/meeting';
import { updateMeeting } from '@/lib/api/meetings';
import { ApiResponse } from '@/lib/api/apiClient';
import { 
  generateFollowUpMessage,
  scheduleFollowUpTask,
  generateMeetingAgenda,
  getComprehensiveMeetingSummary,
  updateMeetingWithSummary,
  getFallbackAgendaItems,
  MeetingAgendaRequest
} from '@/lib/services/aiMeetingService';
import { sendEmail } from '@/lib/services/communicationService';
import { EnhancedMeetingForm } from './EnhancedMeetingForm';
import supabase from '@/lib/supabase/client';
import { useSession } from 'next-auth/react';
import { VersionHistory } from '@/components/meetings/VersionHistory';
import { useToast } from '@/components/ui/use-toast';
import { ContextualPhoneDialog } from '../communications/ContextualPhoneDialog';
import { ContextualEmailDialog } from '../communications/ContextualEmailDialog';
import { ContextualRescheduleDialog } from './ContextualRescheduleDialog';
import { ContextualAgendaDialog } from './ContextualAgendaDialog';
import { ContextualComprehensiveSummaryDialog } from './ContextualComprehensiveSummaryDialog';
import { useMeetingDialog, MeetingDialogType } from '@/contexts/MeetingDialogContext';
import { ContextualFollowUpDialog } from './ContextualFollowUpDialog';

// Extend the Meeting type to include agenda_items
interface EnhancedMeeting extends Meeting {
  agenda_items?: string[];
}

type EnhancedMeetingDetailsProps = {
  meeting: EnhancedMeeting;
  onUpdate?: (updatedMeeting: EnhancedMeeting) => void;
  onClose?: () => void;
};

export function EnhancedMeetingDetails({ 
  meeting, 
  onUpdate, 
  onClose 
}: EnhancedMeetingDetailsProps) {
  console.log('EnhancedMeetingDetails received meeting:', meeting);
  
  // Get the authenticated user's session
  const { data: session } = useSession();
  
  // Access the meeting dialog context at the top level of the component
  const meetingDialog = useMeetingDialog();
  
  // Early return if meeting is null or undefined
  if (!meeting) {
    console.error('EnhancedMeetingDetails: meeting object is null or undefined');
    return (
      <div className="p-4 border rounded-md bg-red-50">
        <h3 className="text-lg font-semibold text-red-700 mb-2">Error</h3>
        <p className="text-red-600">Meeting details could not be loaded. Please try again later.</p>
        {onClose && (
          <Button variant="outline" className="mt-4" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    );
  }
  
  // State for reschedule dialog - Remove the showRescheduleDialog state
  // const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  
  // Add state for showing version history
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  
  // Handle opening the email dialog using React Context
  const handleOpenEmailDialog = () => {
    if (meeting?.lead?.email) {
      // Use React Context dialog approach
      const dialogId = `email-dialog-${meeting.id}-${Date.now()}`;
      console.log('⭐⭐⭐ MEETING DETAILS: Opening email dialog with React Context, ID:', dialogId);
      
      // Use the meetingDialog from the component scope
      const dialogContent = (
        <ContextualEmailDialog
          dialogId={dialogId}
          leadEmail={meeting.lead.email}
          leadName={meeting.lead.first_name + ' ' + meeting.lead.last_name}
          handleClose={() => {
            console.log('⭐⭐⭐ MEETING DETAILS: Email dialog closed via handleClose callback');
            meetingDialog.closeMeetingDialog(dialogId);
          }}
          handleEmailSuccess={handleEmailSuccess}
        />
      );
      
      meetingDialog.openMeetingDialog(dialogId, MeetingDialogType.EMAIL, dialogContent, { meeting });
    } else {
      toast.error("No email address", {
        description: "This lead doesn't have an email address.",
      });
    }
  };
  
  // Handle opening the reschedule dialog using React Context
  const handleOpenRescheduleDialog = () => {
    // Use React Context dialog approach
    const dialogId = `reschedule-dialog-${meeting.id}-${Date.now()}`;
    console.log('⭐⭐⭐ MEETING DETAILS: Opening reschedule dialog with React Context, ID:', dialogId);
    
    // Use the meetingDialog from the component scope
    const dialogContent = (
      <ContextualRescheduleDialog
        dialogId={dialogId}
        meeting={meeting}
        handleClose={() => {
          console.log('⭐⭐⭐ MEETING DETAILS: Reschedule dialog closed via handleClose callback');
          meetingDialog.closeMeetingDialog(dialogId);
        }}
        handleRescheduleSuccess={handleRescheduleSuccess}
      />
    );
    
    meetingDialog.openMeetingDialog(dialogId, MeetingDialogType.RESCHEDULE, dialogContent, { meeting });
  };
  
  // Log activity function
  const logActivity = async (activityType: string, metadata: any) => {
    try {
      if (!meeting.lead?.id) {
        console.log(`Skipping activity log for ${activityType}: No lead ID available`);
        return;
      }

      // Validate that meeting ID exists
      if (!meeting.id) {
        console.warn(`Cannot log ${activityType} activity: Meeting ID is missing`);
        return;
      }
      
      const activityData = {
        lead_id: meeting.lead.id,
        activity_type: "meeting_update",
        metadata: {
          meeting_id: meeting.id,
          action: activityType,
          previous_status: meeting.status,
          ...metadata,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        // Include session user ID if available
        user_id: session?.user?.id
      };
      
      console.log(`Logging ${activityType} activity for meeting ${meeting.id}:`, activityData);
      
      // Instead of directly inserting to Supabase, use our server-side API
      const response = await fetch('/api/v1/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
        credentials: 'include', // Include cookies for auth
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `HTTP error ${response.status}` }));
        throw new Error(`API error: ${response.status} ${response.statusText} - ${
          typeof errorData.error === 'string' ? errorData.error : 
          errorData.detail || 'Unknown error'
        }`);
      }
      
      const result = await response.json();
      console.log(`${activityType} activity logged successfully via API:`, result);
    } catch (error) {
      // Better error logging with error type checking
      console.error(`Error in logActivity(${activityType}):`);
      
      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      } else {
        console.error(`Unknown error type:`, error);
      }
      
      // Re-throw the error to be handled by the caller
      throw error;
    }
  };
  
  // Send calendar invite after rescheduling
  const sendCalendarInvite = async (rescheduledMeeting: Meeting) => {
    if (!meeting.lead?.email) {
      console.error('Cannot send calendar invite: Lead has no email address');
      return {
        success: false,
        message: 'Lead has no email address'
      };
    }
    
    try {
      // Format the meeting details for the email body
      const meetingDate = format(parseISO(rescheduledMeeting.start_time), 'EEEE, MMMM d, yyyy');
      const meetingTime = format(parseISO(rescheduledMeeting.start_time), 'h:mm a');
      const endTime = format(parseISO(rescheduledMeeting.end_time), 'h:mm a');
      const location = rescheduledMeeting.location || 'Virtual meeting';
      
      // Create calendar invite in iCalendar format
      const startDate = new Date(rescheduledMeeting.start_time);
      const endDate = new Date(rescheduledMeeting.end_time);
      
      // Format dates for iCalendar (YYYYMMDDTHHMMSSZ format)
      const formatDateForICal = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/g, '');
      };
      
      const icalStartDate = formatDateForICal(startDate);
      const icalEndDate = formatDateForICal(endDate);
      
      // Generate a unique ID for the event
      const eventUid = `meeting-${rescheduledMeeting.id}-${Date.now()}@yourdomain.com`;
      
      // Create the iCalendar content
      const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Your Company//Your App//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:${icalStartDate}
DTEND:${icalEndDate}
DTSTAMP:${formatDateForICal(new Date())}
ORGANIZER;CN=Your Name:mailto:your-email@example.com
UID:${eventUid}
ATTENDEE;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${meeting.lead.first_name} ${meeting.lead.last_name}:mailto:${meeting.lead.email}
DESCRIPTION:${rescheduledMeeting.description || 'No description available'}
LOCATION:${location}
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:${rescheduledMeeting.title}
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;
      
      // Create a Blob and convert to base64
      const blob = new Blob([icalContent], { type: 'text/calendar' });
      const reader = new FileReader();
      
      const base64Content = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64content = reader.result as string;
          // Remove the data URL prefix
          const base64Data = base64content.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      // Prepare email body
      const emailBody = `
        <div>
          <p>Hello ${meeting.lead.first_name},</p>
          <p>Your meeting has been rescheduled.</p>
          <p><strong>Meeting:</strong> ${rescheduledMeeting.title}</p>
          <p><strong>Date:</strong> ${meetingDate}</p>
          <p><strong>Time:</strong> ${meetingTime} - ${endTime}</p>
          <p><strong>Location:</strong> ${location}</p>
          ${rescheduledMeeting.description ? `<p><strong>Description:</strong> ${rescheduledMeeting.description}</p>` : ''}
          <p>This invitation contains an updated calendar event. Please add it to your calendar.</p>
          <p>Thank you,</p>
          <p>Your Name</p>
        </div>
      `;
      
      // Send the email with the calendar attachment
      const response = await sendEmail({
        to: meeting.lead.email,
        subject: `Updated: ${rescheduledMeeting.title} - ${meetingDate}`,
        content: emailBody,
        attachments: [{
          filename: 'meeting.ics',
          content: base64Content,
          content_type: 'text/calendar',
          size: blob.size
        }]
      });
      
      return response;
    } catch (error) {
      console.error('Error sending calendar invite:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send calendar invite'
      };
    }
  };
  
  // Handle reschedule success
  const handleRescheduleSuccess = async (rescheduledMeeting: Meeting) => {
    console.log('Meeting rescheduled:', rescheduledMeeting);
    
    // Update the meeting status to rescheduled
    const updatedMeeting = {
      ...meeting,
      start_time: rescheduledMeeting.start_time,
      end_time: rescheduledMeeting.end_time,
      location: rescheduledMeeting.location,
      meeting_type: rescheduledMeeting.meeting_type,
      description: rescheduledMeeting.description,
      status: MeetingStatus.RESCHEDULED
    };
    
    // Call the onUpdate callback if provided
    if (onUpdate) {
      onUpdate(updatedMeeting as EnhancedMeeting);
    }
    
    // Send calendar invite with updated meeting details
    const inviteResult = await sendCalendarInvite(rescheduledMeeting);
    
    // Log the activity
    await logActivity('meeting_rescheduled', {
      previous_time: meeting.start_time,
      new_time: rescheduledMeeting.start_time,
      invited_parties: [meeting.lead?.email],
      calendar_invite_sent: inviteResult.success
    });
    
    // Show success/error toast based on the result of sending the calendar invite
    if (!inviteResult.success) {
      console.error('Error sending calendar invite:', inviteResult.message);
      toast.warning("Meeting Rescheduled", {
        description: `Meeting has been rescheduled, but there was an error sending the calendar invite: ${inviteResult.message}`,
      });
    } else {
      toast.success("Meeting Rescheduled", {
        description: `Meeting has been rescheduled to ${format(parseISO(rescheduledMeeting.start_time), 'EEEE, MMMM d, yyyy h:mm a')}`,
      });
    }
    
    // No need to close the dialog, it will be closed by the context's handleClose callback
    
    // Close the meeting details dialog if onClose is provided
    if (onClose) {
      onClose();
    }
  };
  
  // Handle cancel meeting
  const handleCancelMeeting = async () => {
    try {
      const { data, error } = await updateMeeting(meeting.id.toString(), { 
        status: MeetingStatus.CANCELLED 
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Log the activity
      await logActivity('cancelled', {
        new_status: MeetingStatus.CANCELLED
      });
      
      toast.success('Meeting Canceled', {
        description: 'The meeting has been canceled successfully.',
      });
      
      if (onUpdate && data) {
        onUpdate({...data, agenda_items: meeting.agenda_items} as EnhancedMeeting);
      }
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error canceling meeting:', error);
      toast.error('Error', {
        description: 'Failed to cancel the meeting',
      });
    }
  };
  
  // Handle mark as no-show
  const handleMarkAsNoShow = async () => {
    try {
      const { data, error } = await updateMeeting(meeting.id.toString(), { 
        status: MeetingStatus.NO_SHOW 
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Log the activity
      await logActivity('no_show', {
        new_status: MeetingStatus.NO_SHOW
      });
      
      toast.success('Marked as No-Show', {
        description: 'The meeting has been marked as a no-show.',
      });
      
      if (onUpdate && data) {
        onUpdate({...data, agenda_items: meeting.agenda_items} as EnhancedMeeting);
      }
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error marking meeting as no-show:', error);
      toast.error('Error', {
        description: 'Failed to mark the meeting as a no-show',
      });
    }
  };
  
  const [notes, setNotes] = useState(meeting.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [followUpMessage, setFollowUpMessage] = useState<string | null>(null);
  const [editableSubject, setEditableSubject] = useState('');
  const [editableMessage, setEditableMessage] = useState('');
  const [isLoadingFollowUp, setIsLoadingFollowUp] = useState(false);
  const [isLoadingAgendaSuggestions, setIsLoadingAgendaSuggestions] = useState(false);
  const [isLoadingComprehensiveSummary, setIsLoadingComprehensiveSummary] = useState(false);
  const [comprehensiveSummary, setComprehensiveSummary] = useState<{
    summary: string;
    insights: string[];
    action_items: string[];
    next_steps: string[];
    company_analysis?: {
      company_summary?: string;
      industry?: string;
      company_size_estimate?: string;
      strengths?: string[];
      potential_pain_points?: string[];
    };
  } | null>(meeting.comprehensive_summary || null);
  const [comprehensiveSummaryError, setComprehensiveSummaryError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Array<{
    id: string;
    filename: string;
    path: string;
    content_type: string;
    size: number;
    url?: string;
  }>>([]);
  const [isAgendaDialogOpen, setIsAgendaDialogOpen] = useState(false);
  const [agendaSuggestions, setAgendaSuggestions] = useState<string[]>([]);
  
  const [isComprehensiveSummaryDialogOpen, setIsComprehensiveSummaryDialogOpen] = useState(false);

  // Initialize state from meeting data when it changes
  useEffect(() => {
    console.log('Meeting data changed, updating state:', meeting);
    
    // Initialize agenda_items if not present
    if (!meeting.agenda_items) {
      meeting.agenda_items = [];
    }
    
    // Initialize notes from meeting
    setNotes(meeting.notes || '');
    
    // Initialize existing attachments from meeting
    if (meeting.displayAttachments && meeting.displayAttachments.length > 0) {
      setExistingAttachments(meeting.displayAttachments);
    } else if (meeting.attachments && meeting.attachments.length > 0) {
      // Convert attachments to displayAttachments format
      const displayAttachments = meeting.attachments.map((attachment, index) => ({
        id: `existing-${index}`,
        filename: attachment.filename,
        path: attachment.path,
        content_type: attachment.content_type,
        size: attachment.size,
        url: attachment.path // Assuming path contains the URL to access the file
      }));
      setExistingAttachments(displayAttachments);
    } else {
      setExistingAttachments([]);
    }
    
    // Initialize comprehensive summary from meeting
    if (meeting.comprehensive_summary) {
      console.log('Setting comprehensive summary from meeting:', meeting.comprehensive_summary);
      setComprehensiveSummary(meeting.comprehensive_summary);
      
      // Make sure default tab is always 'details'
      if (!isComponentMounted.current) {
        if (activeTab !== 'details') {
          setActiveTab('details');
        }
        isComponentMounted.current = true;
      }
    } else {
      console.log('No comprehensive summary found in meeting data');
    }
  }, [meeting]); // Re-run when the meeting object changes to ensure we catch all updates
  
  // Save meeting notes
  const saveNotes = async () => {
    setIsLoading(true);
    try {
      // Process new file attachments if any
      let processedAttachments: Array<{
        filename: string;
        path?: string;
        content?: string;
        content_type: string;
        size: number;
      }> = [];
      
      // Add existing attachments that haven't been removed
      if (existingAttachments.length > 0) {
        processedAttachments = existingAttachments.map(attachment => ({
          filename: attachment.filename,
          path: attachment.path,
          content_type: attachment.content_type,
          size: attachment.size
        }));
      }
      
      // Process new file uploads
      if (attachments.length > 0) {
        const newAttachments = await Promise.all(
          attachments.map(async (file) => {
            return new Promise<{
              filename: string;
              content: string;
              content_type: string;
              size: number;
            }>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64content = reader.result as string;
                // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
                const base64Data = base64content.split(',')[1];
                resolve({
                  filename: file.name,
                  content: base64Data,
                  content_type: file.type,
                  size: file.size,
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          })
        );
        
        // Add new attachments to processed attachments
        processedAttachments = [...processedAttachments, ...newAttachments];
      }
      
      const { data, error } = await updateMeeting(meeting.id.toString(), { 
        notes,
        attachments: processedAttachments.length > 0 ? processedAttachments : undefined
      } as MeetingUpdate);
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast.success('Meeting notes saved successfully');
      
      // Clear new file uploads after successful save
      setAttachments([]);
      
      if (onUpdate && data) {
        onUpdate({...data, agenda_items: meeting.agenda_items} as EnhancedMeeting);
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Error', {
        description: 'Failed to save meeting notes',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mark meeting as completed
  const markAsCompleted = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await updateMeeting(meeting.id.toString(), { 
        status: MeetingStatus.COMPLETED 
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Log the activity
      await logActivity('completed', {
        new_status: MeetingStatus.COMPLETED
      });
      
      toast.success('Meeting marked as completed');
      
      if (onUpdate && data) {
        onUpdate({...data, agenda_items: meeting.agenda_items} as EnhancedMeeting);
      }
    } catch (error) {
      console.error('Error updating meeting status:', error);
      toast.error('Error', {
        description: 'Failed to update meeting status',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate follow-up message
  const generateFollowUp = async () => {
    setIsLoadingFollowUp(true);
    try {
      console.log('⭐⭐⭐ FOLLOW UP: Generating follow-up for meeting ID:', meeting.id.toString());
      
      // Check if meeting ID is valid
      if (!meeting.id) {
        throw new Error('Meeting ID is missing or invalid');
      }
      
      // Log the meeting object for debugging
      console.log('⭐⭐⭐ FOLLOW UP: Meeting object:', meeting);
      
      const { data, error } = await generateFollowUpMessage(meeting.id.toString());
      
      console.log('⭐⭐⭐ FOLLOW UP: API response:', { data, error });
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
      
      if (!data || !data.subject || !data.message) {
        console.error('Invalid response data:', data);
        throw new Error('Received invalid response data from the server');
      }
      
      // Get user information from the authenticated session
      // Use type assertion to handle the session user data safely
      const userProfile = {
        name: session?.user?.name || 'Your Name',
        title: ((session?.user || {}) as any).title || 'Sales Representative',
        email: session?.user?.email || 'your.email@company.com',
        phone: ((session?.user || {}) as any).phone || '(555) 123-4567'
      };
      
      console.log('⭐⭐⭐ FOLLOW UP: User profile for email:', userProfile);
      
      // Replace placeholders with actual values
      let personalizedMessage = data.message;
      
      // Replace client name if available
      if (meeting.lead?.first_name) {
        const clientName = `${meeting.lead.first_name} ${meeting.lead.last_name || ''}`.trim();
        personalizedMessage = personalizedMessage.replace(/\[Client Name\]/g, clientName);
      }
      
      // Replace user information
      personalizedMessage = personalizedMessage
        .replace(/\[Your Name\]/g, userProfile.name)
        .replace(/\[Your Title\]/g, userProfile.title)
        .replace(/\[Contact Information\]/g, `Email: ${userProfile.email}\nPhone: ${userProfile.phone}`);
      
      // Format the message for TipTap
      // TipTap expects proper HTML with paragraph tags
      let formattedMessage = '';
      
      // Split by double newlines to get paragraphs
      const paragraphs = personalizedMessage.split(/\n\n+/);
      
      // Create HTML with proper paragraph tags
      formattedMessage = paragraphs.map(paragraph => {
        // Replace single newlines with <br> tags
        const withLineBreaks = paragraph.replace(/\n/g, '<br>');
        return `<p>${withLineBreaks}</p>`;
      }).join('');
      
      console.log('⭐⭐⭐ FOLLOW UP: Formatted message for rich text editor:', formattedMessage);
      
      // Store the follow-up message in state
      setFollowUpMessage(formattedMessage);
      
      // Initialize editable fields with the generated content
      setEditableSubject(data.subject);
      setEditableMessage(formattedMessage);
      
      // Use React Context dialog approach instead of Radix UI Dialog
      const dialogId = `follow-up-dialog-${meeting.id}-${Date.now()}`;
      console.log('⭐⭐⭐ FOLLOW UP: Opening follow-up dialog with React Context, ID:', dialogId);
      
      const dialogContent = (
        <ContextualFollowUpDialog
          dialogId={dialogId}
          leadEmail={meeting.lead?.email}
          leadId={meeting.lead?.id}
          leadName={meeting.lead ? `${meeting.lead.first_name} ${meeting.lead.last_name}` : ''}
          meetingId={meeting.id.toString()}
          followUpMessage={formattedMessage}
          subject={data.subject}
          handleClose={() => {
            console.log('⭐⭐⭐ FOLLOW UP: Dialog closed via handleClose callback');
            meetingDialog.closeMeetingDialog(dialogId);
          }}
        />
      );
      
      meetingDialog.openMeetingDialog(
        dialogId, 
        MeetingDialogType.EMAIL, // Use EMAIL type since FOLLOW_UP doesn't exist
        dialogContent, 
        { meeting }
      );
      
    } catch (error) {
      console.error('Error generating follow-up message:', error);
      
      // Get more detailed error information
      let errorMessage = 'Failed to generate follow-up message';
      
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
        console.error('Error stack:', error.stack);
      }
      
      toast.error('Error', {
        description: errorMessage,
      });
    } finally {
      setIsLoadingFollowUp(false);
    }
  };
  
  // Generate AI agenda suggestions
  const generateAgendaSuggestions = async () => {
    console.log('Generating agenda suggestions for meeting:', meeting);
    setIsLoadingAgendaSuggestions(true);
    
    try {
      // Prepare request data
      const requestData: MeetingAgendaRequest = {
        meeting_type: meeting.meeting_type,
        lead_id: meeting.lead_id,
        context: meeting.description
      };
      
      console.log('Request data for agenda suggestions:', requestData);
      
      const { data, error } = await generateMeetingAgenda(requestData);
      
      console.log('Agenda API response:', { data, error });
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        // Check if user is authenticated
        if (!session) {
          toast.error("Authentication Error", {
            description: 'Please log in to generate agenda suggestions'
          });
          return;
        }
        
        // If data is null, the API endpoint might not be available
        toast.error("API Error", {
          description: 'The agenda API endpoint is not available. Using fallback agenda items.'
        });
        
        // Use fallback agenda items
        const fallbackItems = getFallbackAgendaItems(meeting.meeting_type);
        setAgendaSuggestions(fallbackItems);
        
        // Use the contextual dialog approach
        const dialogId = `agenda-dialog-${meeting.id}-${Date.now()}`;
        console.log('⭐⭐⭐ MEETING DETAILS: Opening agenda dialog with React Context, ID:', dialogId);
        
        const dialogContent = (
          <ContextualAgendaDialog
            dialogId={dialogId}
            agendaItems={fallbackItems}
            meetingType={meeting.meeting_type}
            handleClose={() => {
              console.log('⭐⭐⭐ MEETING DETAILS: Agenda dialog closed via handleClose callback');
              meetingDialog.closeMeetingDialog(dialogId);
            }}
            onAddToMeeting={addAgendaItemsToMeeting}
          />
        );
        
        meetingDialog.openMeetingDialog(dialogId, MeetingDialogType.AGENDA, dialogContent, { meeting });
        return;
      }
      
      // Store the suggested agenda items
      setAgendaSuggestions(data.agenda_items);
      
      // Use the contextual dialog approach
      const dialogId = `agenda-dialog-${meeting.id}-${Date.now()}`;
      console.log('⭐⭐⭐ MEETING DETAILS: Opening agenda dialog with React Context, ID:', dialogId);
      
      const dialogContent = (
        <ContextualAgendaDialog
          dialogId={dialogId}
          agendaItems={data.agenda_items}
          meetingType={meeting.meeting_type}
          handleClose={() => {
            console.log('⭐⭐⭐ MEETING DETAILS: Agenda dialog closed via handleClose callback');
            meetingDialog.closeMeetingDialog(dialogId);
          }}
          onAddToMeeting={addAgendaItemsToMeeting}
        />
      );
      
      meetingDialog.openMeetingDialog(dialogId, MeetingDialogType.AGENDA, dialogContent, { meeting });
    } catch (error) {
      console.error('Error generating agenda suggestions:', error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : 'Failed to generate agenda suggestions'
      });
    } finally {
      setIsLoadingAgendaSuggestions(false);
    }
  };
  
  // Function to add the suggested agenda items to the meeting
  const addAgendaItemsToMeeting = async () => {
    try {
      // Ensure meeting.agenda_items is initialized
      const currentAgendaItems = meeting.agenda_items || [];
      
      // Update the meeting with the suggested agenda items
      const updatedAgendaItems = [...currentAgendaItems, ...agendaSuggestions];
      console.log('Updated agenda items:', updatedAgendaItems);
      
      // Update the meeting in the database
      const updatedMeeting = {
        ...meeting,
        agenda_items: updatedAgendaItems
      };
      
      // Call the API to update the meeting
      const { data: updatedData, error: updateError } = await updateMeeting(meeting.id, updatedMeeting);
      
      if (updateError) {
        throw updateError;
      }
      
      toast.success('AI agenda suggestions added');
      
      // Update the local state
      onUpdate?.({...updatedMeeting, agenda_items: updatedAgendaItems} as EnhancedMeeting);
    } catch (error) {
      console.error('Error adding agenda items to meeting:', error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : 'Failed to add agenda items to meeting'
      });
    }
  };
  
  // Generate comprehensive meeting summary
  const handleGenerateComprehensiveSummary = async (e?: React.MouseEvent) => {
    console.log('⚠️⚠️⚠️ BUTTON ACTION [1]: handleGenerateComprehensiveSummary START', { 
      hasEvent: !!e, 
      eventType: e ? e.type : 'none',
      target: e ? e.target : 'none',
      currentTarget: e ? e.currentTarget : 'none',
      time: new Date().toISOString()
    });
    
    // Prevent event propagation if an event object is provided
    if (e) {
      console.log('⚠️⚠️⚠️ BUTTON ACTION [2]: Preventing default behavior and stopping propagation');
      e.preventDefault();
      e.stopPropagation();
      
      if (e.nativeEvent) {
        console.log('⚠️⚠️⚠️ BUTTON ACTION [3]: Stopping immediate propagation on native event');
        e.nativeEvent.stopImmediatePropagation();
      }
    }
    
    console.log('⚠️⚠️⚠️ BUTTON ACTION [4]: Checking if comprehensiveSummary exists:', !!comprehensiveSummary);
    
    // If we already have a summary, just show the dialog
    if (comprehensiveSummary) {
      console.log('⚠️⚠️⚠️ BUTTON ACTION [5]: Comprehensive summary exists, calling openComprehensiveSummaryDialog');
      return openComprehensiveSummaryDialog(e as React.MouseEvent);
    }
    
    // Otherwise, generate a new summary
    console.log('⚠️⚠️⚠️ BUTTON ACTION [6]: No summary exists, starting generation process');
    setIsLoadingComprehensiveSummary(true);
    setComprehensiveSummaryError(null);
    
    console.log('⚠️⚠️⚠️ BUTTON ACTION [7]: Loading state set, proceeding with generation');
    
    toast.success("Generating Summary", {
      description: 'Generating comprehensive summary. This may take up to 30 seconds...',
    });
    
    console.log('⚠️⚠️⚠️ BUTTON ACTION [8]: Starting API call to generate comprehensive summary');
    
    try {
      // Call the API to generate the summary
      console.log('⚠️⚠️⚠️ BUTTON ACTION [9]: Starting Promise.race with API call and timeout');
      const result = await Promise.race([
        getComprehensiveMeetingSummary(meeting.id),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 60000))
      ]) as any;
      
      console.log('⚠️⚠️⚠️ BUTTON ACTION [10]: API call completed, result:', result);
      
      if (!result.data) {
        console.log('⚠️⚠️⚠️ BUTTON ACTION [11]: No data returned from API');
        throw new Error('No data returned from API');
      }
      
      // Update the meeting in the database with the summary
      console.log('⚠️⚠️⚠️ BUTTON ACTION [12]: Updating meeting in database with summary');
      const { data: updatedMeeting, error: updateError } = await updateMeeting(meeting.id, {
        comprehensive_summary: result.data
      });
      
      if (updateError) {
        console.log('⚠️⚠️⚠️ BUTTON ACTION [13]: Error updating meeting:', updateError);
        throw new Error(updateError.message);
      }
      
      // Update the state with the comprehensive summary
      console.log('⚠️⚠️⚠️ BUTTON ACTION [14]: Setting comprehensive summary state');
      setComprehensiveSummary(result.data);
      
      toast.success('Comprehensive summary generated successfully!');
      
      // Open the dialog to show the summary using the contextual approach
      console.log('⚠️⚠️⚠️ BUTTON ACTION [15]: Opening dialog to show new summary');
      const timestamp = Date.now();
      const randomId = Math.floor(Math.random() * 10000);
      const dialogId = `comprehensive-summary-${meeting.id}-${timestamp}-${randomId}`;
      console.log('⚠️⚠️⚠️ BUTTON ACTION [16]: Created dialog ID for new summary:', dialogId);
      
      const dialogContent = (
        <ContextualComprehensiveSummaryDialog
          dialogId={dialogId}
          summary={result.data}
          handleClose={() => {
            console.log('⚠️⚠️⚠️ BUTTON ACTION [17]: Dialog close callback called for new summary dialog');
            meetingDialog.closeMeetingDialog(dialogId);
          }}
        />
      );
      
      // Open the dialog but don't pass the full meeting object, just the ID
      console.log('⚠️⚠️⚠️ BUTTON ACTION [18]: Opening dialog for new summary');
      meetingDialog.openMeetingDialog(
        dialogId, 
        MeetingDialogType.COMPREHENSIVE_SUMMARY, 
        dialogContent, 
        { meetingId: meeting.id }
      );
      console.log('⚠️⚠️⚠️ BUTTON ACTION [19]: New summary dialog opened');
      
      // Update the parent component with the updated meeting
      if (onUpdate && updatedMeeting) {
        console.log('⚠️⚠️⚠️ BUTTON ACTION [20]: SKIPPING onUpdate to prevent dialog refresh');
        // Don't call onUpdate to avoid closing/reopening the dialog
        // The comprehensive summary is shown in a separate dialog anyway
        // onUpdate(updatedMeeting);
      }
    } catch (error) {
      console.error('⚠️⚠️⚠️ BUTTON ACTION [ERROR]: Error generating comprehensive summary:', error);
      setComprehensiveSummaryError(error instanceof Error ? error.message : 'Unknown error');
      toast.error("Error", {
        description: error instanceof Error ? error.message : 'Failed to generate comprehensive summary'
      });
    } finally {
      console.log('⚠️⚠️⚠️ BUTTON ACTION [21]: Setting isLoadingComprehensiveSummary to false');
      setIsLoadingComprehensiveSummary(false);
    }
  };
  
  // Function that isolates opening the comprehensive summary dialog
  const openComprehensiveSummaryDialog = (e: React.MouseEvent) => {
    console.log('⚠️⚠️⚠️ DIALOG OPEN [1]: openComprehensiveSummaryDialog START', {
      eventType: e?.type,
      target: e?.target,
      currentTarget: e?.currentTarget,
      time: new Date().toISOString(),
      summaryExists: !!comprehensiveSummary
    });
    
    // Stop all propagation and prevent default
    console.log('⚠️⚠️⚠️ DIALOG OPEN [2]: Preventing default behavior and stopping propagation');
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Prevent the event from bubbling up
      if (e.nativeEvent) {
        console.log('⚠️⚠️⚠️ DIALOG OPEN [3]: Stopping immediate propagation on native event');
        e.nativeEvent.stopImmediatePropagation();
      }
    }
    
    // Create a completely unique ID to avoid any potential conflicts
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const dialogId = `comprehensive-summary-${timestamp}-${randomString}`;
    
    console.log('⚠️⚠️⚠️ DIALOG OPEN [4]: Created unique dialog ID:', dialogId);
    console.log('⚠️⚠️⚠️ DIALOG OPEN [5]: Creating dialog content with summary');
    
    const dialogContent = (
      <ContextualComprehensiveSummaryDialog
        dialogId={dialogId}
        summary={comprehensiveSummary}
        handleClose={() => {
          console.log('⚠️⚠️⚠️ DIALOG OPEN [6]: Dialog close callback called for ID:', dialogId);
          meetingDialog.closeMeetingDialog(dialogId);
        }}
      />
    );
    
    // Don't pass any meeting data at all to avoid re-renders
    console.log('⚠️⚠️⚠️ DIALOG OPEN [7]: About to call meetingDialog.openMeetingDialog with empty data object');
    meetingDialog.openMeetingDialog(
      dialogId, 
      MeetingDialogType.COMPREHENSIVE_SUMMARY, 
      dialogContent,
      {} // Empty object for data
    );
    
    console.log('⚠️⚠️⚠️ DIALOG OPEN [8]: meetingDialog.openMeetingDialog called successfully');
    // Return false to further ensure event doesn't propagate
    return false;
  };
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to array and add to attachments
      const newFiles = Array.from(e.target.files);
      
      // Check file sizes (SendGrid limit is 30MB total, but we'll limit individual files to 10MB)
      const oversizedFiles = newFiles.filter(file => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error('File size exceeded', {
          description: `${oversizedFiles.length > 1 ? 'Some files are' : 'One file is'} larger than 10MB and cannot be attached.`,
        });
        
        // Filter out oversized files
        const validFiles = newFiles.filter(file => file.size <= 10 * 1024 * 1024);
        if (validFiles.length > 0) {
          setAttachments([...attachments, ...validFiles]);
          
          // Show success toast for valid files
          toast.success('Files attached', {
            description: `${validFiles.length} ${validFiles.length === 1 ? 'file' : 'files'} attached successfully.`,
          });
        }
      } else {
        // All files are valid
        setAttachments([...attachments, ...newFiles]);
        
        // Show success toast
        toast.success('Files attached', {
          description: `${newFiles.length} ${newFiles.length === 1 ? 'file' : 'files'} attached successfully: ${newFiles.map(f => f.name).join(', ')}`,
        });
      }
      
      // Clear the input value so the same file can be selected again
      e.target.value = '';
    }
  };
  
  // Handle file removal
  const handleRemoveFile = (index: number) => {
    const newAttachments = [...attachments];
    const removedFile = newAttachments[index];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
    
    // Show toast for removed file
    toast.info('File removed', {
      description: `Removed ${removedFile.name}`,
    });
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Handle version selection
  const handleVersionSelected = (version: any) => {
    // Update the notes with the selected version content
    setNotes(version.content);
    
    // Update existing attachments if the version has attachments
    if (version.attachments && version.attachments.length > 0) {
      setExistingAttachments(version.attachments);
    }
    
    toast.success('Version loaded', {
      description: `Loaded version ${version.version_number}`,
    });
  };
  
  // Handle downloading a file
  const handleDownloadFile = (attachment: any) => {
    if (attachment.url) {
      window.open(attachment.url, '_blank');
    } else {
      toast.error('Error', {
        description: 'File URL not available',
      });
    }
  };
  
  // Handle removing an existing file
  const handleRemoveExistingFile = (index: number) => {
    const attachment = existingAttachments[index];
    const newExistingAttachments = [...existingAttachments];
    newExistingAttachments.splice(index, 1);
    setExistingAttachments(newExistingAttachments);
    
    toast.info('File removed', {
      description: `Removed ${attachment.filename}`,
    });
  };
  
  // Handle opening the phone dialog using React Context
  const handleOpenPhoneDialog = () => {
    if (meeting?.lead?.phone) {
      // Use React Context dialog approach
      const dialogId = `phone-dialog-${meeting.id}-${Date.now()}`;
      console.log('⭐⭐⭐ MEETING DETAILS: Opening phone dialog with React Context, ID:', dialogId);
      
      // Use the meetingDialog from the component scope instead of calling the hook here
      const dialogContent = (
        <ContextualPhoneDialog
          dialogId={dialogId}
          leadPhone={meeting.lead.phone}
          leadName={meeting.lead.first_name + ' ' + meeting.lead.last_name}
          handleClose={() => {
            console.log('⭐⭐⭐ MEETING DETAILS: Phone dialog closed via handleClose callback');
            meetingDialog.closeMeetingDialog(dialogId);
          }}
          handlePhoneCallSuccess={handlePhoneCallSuccess}
        />
      );
      
      meetingDialog.openMeetingDialog(dialogId, MeetingDialogType.PHONE, dialogContent, { meeting });
    } else {
      toast.error("No phone number", {
        description: "This lead doesn't have a phone number.",
      });
    }
  };
  
  // Handle phone call success
  const handlePhoneCallSuccess = (callData: { phoneNumber: string; duration: number; notes: string }) => {
    console.log('Phone call completed:', callData);
    toast.success("Call completed", {
      description: `Call to ${callData.phoneNumber} completed (${callData.duration} seconds)`,
    });
  };
  
  // Handle email success
  const handleEmailSuccess = (emailData: { to: string; subject: string; body: string }) => {
    console.log('Email sent:', emailData);
    toast.success("Email sent", {
      description: `Email to ${emailData.to} sent successfully`,
    });
  };
  
  // Initialize a ref to track component mount state
  const isComponentMounted = useRef(false);

  // Cleanup effect to reset ref on unmount
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  return (
    <Card className="w-full max-w-full overflow-visible">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{meeting.title}</span>
          <Badge variant={meeting.status === MeetingStatus.COMPLETED ? 'success' : 'default'}>
            {meeting.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto overflow-y-visible">
        {/* Lead Information Section */}
        {meeting.lead && (
          <div className="p-4 mb-4 border rounded-lg bg-muted/30">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  {meeting.lead.first_name} {meeting.lead.last_name}
                </h3>
                {meeting.lead.company && (
                  <p className="text-sm text-muted-foreground ml-7">{meeting.lead.company}</p>
                )}
                {meeting.lead.email && (
                  <p className="text-sm flex items-center ml-7 mt-2">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    {meeting.lead.email}
                  </p>
                )}
                {meeting.lead.phone && (
                  <p className="text-sm flex items-center ml-7 mt-1">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    {meeting.lead.phone}
                  </p>
                )}
              </div>
              <div className="flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleOpenPhoneDialog}
                    className="flex items-center"
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleOpenEmailDialog}
                    className="flex items-center"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleOpenRescheduleDialog}
                    className="flex items-center"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Reschedule
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancelMeeting}
                    className="flex items-center text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleMarkAsNoShow}
                    className="flex items-center text-amber-500"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    No-Show
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="overflow-visible">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 overflow-x-auto styled-scrollbar min-w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 opacity-70" />
                  <span>
                    {meeting.start_time ? format(parseISO(meeting.start_time), 'EEEE, MMMM d, yyyy') : 'Date not specified'}
                  </span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Clock className="mr-2 h-4 w-4 opacity-70" />
                  <span>
                    {meeting.start_time && meeting.end_time ? 
                      `${format(parseISO(meeting.start_time), 'h:mm a')} - ${format(parseISO(meeting.end_time), 'h:mm a')}` : 
                      'Time not specified'}
                  </span>
                </div>
                
                {meeting.location && (
                  <div className="flex items-center text-sm">
                    <MapPin className="mr-2 h-4 w-4 opacity-70" />
                    <span>{meeting.location}</span>
                  </div>
                )}
                
                {meeting.meeting_type && (
                  <div className="flex items-center text-sm">
                    <FileText className="mr-2 h-4 w-4 opacity-70" />
                    <span>{meeting.meeting_type}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {meeting.lead && (
                  <div className="flex items-center text-sm">
                    <User className="mr-2 h-4 w-4 opacity-70" />
                    <span>
                      {meeting.lead.first_name} {meeting.lead.last_name}
                      {meeting.lead.company && (
                        <span className="text-gray-500 ml-1">
                          ({meeting.lead.company})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                
                {meeting.description && (
                  <div className="text-sm mt-2">
                    <p className="text-gray-700">{meeting.description}</p>
                  </div>
                )}
                
                {meeting.agenda_items && meeting.agenda_items.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Agenda</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {meeting.agenda_items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-6">
              {meeting.status !== MeetingStatus.COMPLETED && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={markAsCompleted}
                  disabled={isLoading}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Mark as Completed
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={generateAgendaSuggestions}
                disabled={isLoadingAgendaSuggestions}
              >
                <Sparkles className="mr-1 h-4 w-4 text-blue-500" />
                {isLoadingAgendaSuggestions ? 'Generating...' : 'AI Agenda Suggestions'}
              </Button>
              
              {!comprehensiveSummary ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    console.log('⚠️⚠️⚠️ BUTTON CLICK [1]: Comprehensive Summary Generate button clicked', {
                      eventType: e.type,
                      target: e.target,
                      meetingId: meeting.id,
                      time: new Date().toISOString()
                    });
                    // Prevent default behavior and propagation
                    e.preventDefault();
                    e.stopPropagation();
                    handleGenerateComprehensiveSummary(e);
                  }}
                  disabled={isLoadingComprehensiveSummary}
                >
                  <FileText className="mr-1 h-4 w-4 text-blue-500" />
                  {isLoadingComprehensiveSummary ? 'Generating...' : 'Comprehensive AI Summary'}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    console.log('⚠️⚠️⚠️ BUTTON CLICK [2]: View Comprehensive Summary button clicked', {
                      eventType: e.type,
                      target: e.target,
                      meetingId: meeting.id,
                      time: new Date().toISOString(),
                      summaryExists: !!comprehensiveSummary
                    });
                    // Directly call the isolated function without going through handleGenerateComprehensiveSummary
                    openComprehensiveSummaryDialog(e);
                  }}
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  <FileText className="mr-1 h-4 w-4 text-blue-500" />
                  View Comprehensive Summary
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={generateFollowUp}
                disabled={isLoadingFollowUp}
              >
                <MessageSquare className="mr-1 h-4 w-4 text-blue-500" />
                {isLoadingFollowUp ? 'Generating...' : 'Generate Follow-up'}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="notes" className="space-y-4 overflow-x-auto styled-scrollbar min-w-full">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Meeting Notes</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                >
                  {showVersionHistory ? 'Hide Version History' : 'Show Version History'}
                </Button>
              </div>
              
              {showVersionHistory && (
                <div className="mb-4 border rounded-md p-4 bg-muted/30">
                  <VersionHistory 
                    meetingId={meeting.id.toString()} 
                    currentVersionId={meeting.current_note_version_id}
                    onSelectVersion={handleVersionSelected}
                  />
                </div>
              )}
              
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter meeting notes here..."
                className="min-h-[200px]"
              />
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Attachments</h3>
                  <div className="text-sm text-muted-foreground">
                    {(attachments.length > 0 || existingAttachments.length > 0) 
                      ? `${attachments.length + existingAttachments.length} file(s) attached`
                      : 'No files attached'
                    }
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    id="notes-file-upload"
                    className="hidden"
                    onChange={handleFileSelect}
                    multiple
                  />
                  <label
                    htmlFor="notes-file-upload"
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  >
                    <Paperclip className="mr-2 h-4 w-4" />
                    Attach Files
                  </label>
                </div>
                
                <div className="text-xs text-muted-foreground mt-1">
                  <p>Supports most common file types (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, GIF, etc.)</p>
                  <p>Maximum file size: 10MB per file, 30MB total. Executable files (.exe, .bat, etc.) are not allowed.</p>
                </div>
                
                {/* Existing attachments */}
                {existingAttachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Existing Attachments</h4>
                    <div className="space-y-2">
                      {existingAttachments.map((attachment, index) => (
                        <div key={attachment.id} className="flex items-center justify-between bg-background rounded-md p-2 border">
                          <div className="flex items-center space-x-2 overflow-hidden">
                            <Paperclip className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm truncate">{attachment.filename}</span>
                            <span className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadFile(attachment)}
                              className="h-6 w-6 p-0"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveExistingFile(index)}
                              className="h-6 w-6 p-0"
                              title="Remove"
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* New attachments */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">New Attachments</h4>
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={`new-${index}`} className="flex items-center justify-between bg-accent/50 rounded-md p-2">
                          <div className="flex items-center space-x-2 overflow-hidden">
                            <Paperclip className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(index)}
                            className="h-6 w-6 p-0"
                            title="Remove"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={saveNotes} 
                  disabled={isLoading || (notes === meeting.notes && attachments.length === 0 && existingAttachments.length === (meeting.displayAttachments?.length || meeting.attachments?.length || 0))}
                >
                  {isLoading ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Follow-up Dialog - No longer needed, using React Context approach */}
      {/* <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-auto styled-scrollbar">
          <DialogHeader>
            <DialogTitle>AI-Generated Follow-up</DialogTitle>
          </DialogHeader>
          
          {isLoadingFollowUp ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
              <div className="flex justify-end space-x-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          ) : showTaskConfirmation && scheduledTaskDetails ? (
            <div className="space-y-4 overflow-x-auto">
              <div className="overflow-y-auto styled-scrollbar" style={{ maxHeight: '60vh' }}>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-4">
                  <h3 className="text-sm font-medium mb-2 text-green-800 dark:text-green-300 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Task Scheduled Successfully
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Task ID:</span> {scheduledTaskDetails.task_id}</p>
                    <p><span className="font-medium">Title:</span> {scheduledTaskDetails.title}</p>
                    <p><span className="font-medium">Description:</span> {scheduledTaskDetails.description}</p>
                    <p><span className="font-medium">Due Date:</span> {format(new Date(scheduledTaskDetails.scheduled_date), 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="default"
                  onClick={() => {
                    setShowTaskConfirmation(false);
                    setShowFollowUpDialog(false);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : followUpMessage ? (
            <div className="space-y-4 overflow-x-auto">
              <div className="overflow-y-auto styled-scrollbar" style={{ maxHeight: '60vh' }}>
                <div>
                  <h3 className="text-sm font-medium mb-2">Subject</h3>
                  <Input 
                    value={editableSubject}
                    onChange={(e) => setEditableSubject(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Message</h3>
                  <RichTextEditor
                    content={editableMessage}
                    onChange={setEditableMessage}
                    placeholder="Edit your follow-up message here..."
                    className="min-h-[300px]"
                  />
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Attachments</h3>
                    <div className="text-sm text-muted-foreground">
                      {attachments.length > 0 
                        ? attachments.length === 1 
                          ? `1 file attached: ${attachments[0].name}` 
                          : `${attachments.length} files attached: ${attachments.map(file => file.name).join(', ')}`
                        : 'No files attached'
                      }
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      id="follow-up-file-upload"
                      className="hidden"
                      onChange={handleFileSelect}
                      multiple
                    />
                    <label
                      htmlFor="follow-up-file-upload"
                      className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                      <Paperclip className="mr-2 h-4 w-4" />
                      Attach Files
                    </label>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    <p>SendGrid supports most common file types (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, GIF, etc.)</p>
                    <p>Maximum file size: 10MB per file, 30MB total. Executable files (.exe, .bat, etc.) are not allowed.</p>
                  </div>
                  
                  {attachments.length > 0 && (
                    <div className="border rounded-md p-2 space-y-2 max-h-[150px] overflow-y-auto">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-accent/50 rounded-md p-2">
                          <div className="flex items-center space-x-2 overflow-hidden">
                            <Paperclip className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFollowUpDialog(false)}
                >
                  Close
                </Button>
                
                <Button
                  variant="default"
                  onClick={() => scheduleFollowUp(3)}
                  disabled={isSchedulingFollowUp}
                >
                  <ClipboardList className="mr-1 h-4 w-4" />
                  {isSchedulingFollowUp ? 'Scheduling...' : 'Schedule Follow-up Task'}
                </Button>
                
                <Button
                  variant="default"
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || !meeting.lead?.email}
                >
                  <Send className="mr-1 h-4 w-4" />
                  {isSendingEmail ? 'Sending...' : 'Send Email'}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog> */}
      
      {/* Email Dialog */}
      {/* <ContextualEmailDialog
        leadEmail={meeting.lead.email || ''}
        leadName={`${meeting.lead.first_name} ${meeting.lead.last_name}`}
        handleClose={() => {
          console.log('⭐⭐⭐ MEETING DETAILS: Email dialog closed via handleClose callback');
          meetingDialog.closeMeetingDialog(`email-dialog-${meeting.id}-${Date.now()}`);
        }}
        handleEmailSuccess={handleEmailSuccess}
      /> */}
      
      {/* Reschedule Dialog */}
      {/* <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}> */}
        {/* <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-auto styled-scrollbar"> */}
          {meeting && meeting.lead && (
            <EnhancedMeetingForm
              leadOptions={meeting.lead ? [meeting.lead] : []}
              initialTimeSlot={{
                start_time: meeting.start_time,
                end_time: meeting.end_time
              }}
              onSuccess={(newMeeting) => {
                // Set loading state
                setIsRescheduling(true);
                
                // Create a rescheduled meeting based on the new meeting details
                const rescheduledMeeting = {
                  ...meeting,
                  start_time: newMeeting.start_time,
                  end_time: newMeeting.end_time,
                  location: newMeeting.location,
                  meeting_type: newMeeting.meeting_type,
                  description: newMeeting.description,
                  status: MeetingStatus.RESCHEDULED
                };
                
                // Update the original meeting with the new status and times
                updateMeeting(meeting.id.toString(), {
                  start_time: newMeeting.start_time,
                  end_time: newMeeting.end_time,
                  location: newMeeting.location,
                  meeting_type: newMeeting.meeting_type,
                  description: newMeeting.description,
                  status: MeetingStatus.RESCHEDULED
                }).then(({ data, error }) => {
                  if (error) {
                    console.error('Error rescheduling meeting:', error);
                    toast.error('Error', {
                      description: 'Failed to reschedule the meeting',
                    });
                    setIsRescheduling(false);
                    return;
                  }
                  
                  // Call the handleRescheduleSuccess function with the updated meeting
                  handleRescheduleSuccess(rescheduledMeeting)
                    .finally(() => {
                      setIsRescheduling(false);
                    });
                });
              }}
              onCancel={() => {
                // Do nothing, this is just a placeholder since we commented out the original dialog
              }}
            />
          )}
          {isRescheduling && (
            <div className="mt-4 flex items-center justify-center p-4">
              <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                <p className="text-sm text-muted-foreground">Rescheduling meeting and sending calendar invite...</p>
              </div>
            </div>
          )}
        {/* </DialogContent> */}
      {/* </Dialog> */}
      
      {/* Add the ComprehensiveSummaryDialog component */}
      {/* <ContextualComprehensiveSummaryDialog
        isOpen={isComprehensiveSummaryDialogOpen}
        onClose={() => setIsComprehensiveSummaryDialogOpen(false)}
        summary={comprehensiveSummary}
      /> */}
    </Card>
  );
} 
// End of EnhancedMeetingDetails component 