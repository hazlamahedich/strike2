import { useState, useEffect } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import RichTextEditor from '../communications/RichTextEditor';

import { Meeting, MeetingStatus, MeetingUpdate } from '@/lib/types/meeting';
import { updateMeeting } from '@/lib/api/meetings';
import { ApiResponse } from '@/lib/api/apiClient';
import { 
  getMeetingSummaryAI as getMeetingSummary, 
  generateFollowUpMessage,
  scheduleFollowUpTask,
  generateMeetingAgenda,
  getComprehensiveMeetingSummary,
  updateMeetingWithSummary,
  getFallbackAgendaItems
} from '@/lib/services/aiMeetingService';
import { sendEmail } from '@/lib/services/communicationService';
import { PhoneDialog } from '../communications/PhoneDialog';
import { EmailDialog } from '../communications/EmailDialog';
import { EnhancedMeetingForm } from './EnhancedMeetingForm';
import supabase from '@/lib/supabase/client';
import { useSession } from 'next-auth/react';
import { VersionHistory } from '@/components/meetings/VersionHistory';
import { useToast } from '@/components/ui/use-toast';

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
  
  // State for phone and email dialogs
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  
  // Add state for showing version history
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  
  // Handle opening the phone dialog
  const handleOpenPhoneDialog = () => {
    if (meeting?.lead?.phone) {
      setShowPhoneDialog(true);
    } else {
      toast.error("No phone number", {
        description: "This lead doesn't have a phone number.",
      });
    }
  };
  
  // Handle opening the email dialog
  const handleOpenEmailDialog = () => {
    if (meeting?.lead?.email) {
      setShowEmailDialog(true);
    } else {
      toast.error("No email address", {
        description: "This lead doesn't have an email address.",
      });
    }
  };
  
  // Handle opening the reschedule dialog
  const handleOpenRescheduleDialog = () => {
    setShowRescheduleDialog(true);
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
    
    // Try to log the activity but don't let it block the process
    try {
      await logActivity('meeting_rescheduled', {
        meeting_id: meeting.id,
        new_start_time: rescheduledMeeting.start_time,
        new_end_time: rescheduledMeeting.end_time,
        description: rescheduledMeeting.start_time ? 
          `Meeting has been rescheduled to ${format(parseISO(rescheduledMeeting.start_time), 'EEEE, MMMM d, yyyy h:mm a')}` :
          'Meeting has been rescheduled',
      });
    } catch (error) {
      // Log but continue with the process
      console.error('Failed to log meeting reschedule activity:', error);
    }
    
    // Send calendar invite
    if (meeting.lead?.email) {
      try {
        const inviteResponse = await sendCalendarInvite(rescheduledMeeting);
        
        if (inviteResponse.success) {
          toast.success("Meeting Rescheduled", {
            description: `Meeting has been rescheduled to ${format(parseISO(rescheduledMeeting.start_time), 'EEEE, MMMM d, yyyy h:mm a')}. Calendar invite sent to ${meeting.lead.first_name} ${meeting.lead.last_name} (${meeting.lead.email}).`,
          });
        } else {
          toast.success("Meeting Rescheduled", {
            description: `Meeting has been rescheduled to ${format(parseISO(rescheduledMeeting.start_time), 'EEEE, MMMM d, yyyy h:mm a')}, but failed to send calendar invite.`,
          });
          
          toast.error("Failed to send calendar invite", {
            description: `Could not send calendar invite to ${meeting.lead.email}: ${inviteResponse.message}`,
          });
        }
      } catch (emailError) {
        console.error('Error sending calendar invite:', emailError);
        toast.success("Meeting Rescheduled", {
          description: `Meeting has been rescheduled to ${format(parseISO(rescheduledMeeting.start_time), 'EEEE, MMMM d, yyyy h:mm a')}`,
        });
        toast.error("Failed to send calendar invite", {
          description: `An unexpected error occurred while sending the calendar invite.`,
        });
      }
    } else {
      toast.success("Meeting Rescheduled", {
        description: `Meeting has been rescheduled to ${format(parseISO(rescheduledMeeting.start_time), 'EEEE, MMMM d, yyyy h:mm a')}`,
      });
    }
    
    setShowRescheduleDialog(false);
    
    // Close the meeting details dialog if onClose is provided
    if (onClose) {
      onClose();
    }
  };
  
  // Handle phone call success
  const handlePhoneCallSuccess = (callData: { phoneNumber: string; duration: number; notes: string }) => {
    console.log('Phone call completed:', callData);
    toast.success("Call completed", {
      description: `Call to ${callData.phoneNumber} completed (${callData.duration} seconds)`,
    });
    setShowPhoneDialog(false);
  };
  
  // Handle email success
  const handleEmailSuccess = (emailData: { to: string; subject: string; body: string }) => {
    console.log('Email sent:', emailData);
    toast.success("Email sent", {
      description: `Email to ${emailData.to} sent successfully`,
    });
    setShowEmailDialog(false);
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
  const [meetingSummary, setMeetingSummary] = useState<{ summary: string; action_items: string[] } | null>(
    meeting.summary && meeting.action_items ? 
    { summary: meeting.summary, action_items: meeting.action_items } : 
    null
  );
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState<string | null>(null);
  const [editableSubject, setEditableSubject] = useState('');
  const [editableMessage, setEditableMessage] = useState('');
  const [isLoadingFollowUp, setIsLoadingFollowUp] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
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
  const [scheduledTaskDetails, setScheduledTaskDetails] = useState<{
    task_id: string;
    scheduled_date: string;
    title: string;
    description: string;
  } | null>(null);
  const [showTaskConfirmation, setShowTaskConfirmation] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Array<{
    id: string;
    filename: string;
    path: string;
    content_type: string;
    size: number;
    url?: string;
  }>>([]);

  // Initialize state from meeting data when it changes
  useEffect(() => {
    console.log('Meeting data changed, updating state:', meeting);
    
    // Initialize agenda_items if not present
    if (!meeting.agenda_items) {
      meeting.agenda_items = [];
    }
    
    // Initialize notes from meeting
    setNotes(meeting.notes || '');
    
    // Initialize summary data from meeting
    if (meeting.summary && meeting.action_items) {
      setMeetingSummary({ 
        summary: meeting.summary, 
        action_items: meeting.action_items 
      });
    }
    
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
      
      // If we have a comprehensive summary, make sure the summary tab is active
      if (activeTab !== 'summary') {
        setActiveTab('summary');
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
  
  // Generate meeting summary
  const generateSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const { data, error } = await getMeetingSummary(meeting.id.toString());
      
      if (error) {
        throw new Error(error.message);
      }
      
      setMeetingSummary(data);
      setActiveTab('summary');
      
      try {
        // Save summary to meeting object
        const { data: updatedMeeting, error: updateError } = await updateMeeting(meeting.id.toString(), { 
          summary: data.summary,
          action_items: data.action_items
        });
        
        if (updateError) {
          console.error('Error saving summary to meeting:', updateError);
          toast.error("Warning", {
            description: "Summary generated but could not be saved to the meeting record.",
          });
        } else if (onUpdate && updatedMeeting) {
          // Preserve existing comprehensive summary if present
          const updatedMeetingWithComprehensive = {
            ...updatedMeeting,
            comprehensive_summary: meeting.comprehensive_summary,
            agenda_items: meeting.agenda_items
          };
          onUpdate(updatedMeetingWithComprehensive as EnhancedMeeting);
          
          toast.success("Summary generated and saved.");
        }
      } catch (innerError) {
        console.error('Error saving summary to meeting:', innerError);
        toast.error("Warning", {
          description: "Summary generated but could not be saved to the meeting record.",
        });
      }
    } catch (error) {
      console.error('Error generating meeting summary:', error);
      toast.error('Error', {
        description: 'Failed to generate meeting summary',
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };
  
  // Generate follow-up message
  const generateFollowUp = async () => {
    setIsLoadingFollowUp(true);
    // Reset task confirmation state to ensure we show the message dialog first
    setShowTaskConfirmation(false);
    try {
      console.log('Generating follow-up for meeting ID:', meeting.id.toString());
      
      // Check if meeting ID is valid
      if (!meeting.id) {
        throw new Error('Meeting ID is missing or invalid');
      }
      
      // Log the meeting object for debugging
      console.log('Meeting object:', meeting);
      
      const { data, error } = await generateFollowUpMessage(meeting.id.toString());
      
      console.log('Follow-up API response:', { data, error });
      
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
      
      console.log('User profile for email:', userProfile);
      
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
      
      console.log('Formatted message for rich text editor:', formattedMessage);
      
      setFollowUpMessage(formattedMessage);
      // Initialize editable fields with the generated content
      setEditableSubject(data.subject);
      setEditableMessage(formattedMessage);
      setShowFollowUpDialog(true);
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
  
  // Schedule follow-up task
  const scheduleFollowUp = async (daysDelay: number = 3) => {
    setIsSchedulingFollowUp(true);
    try {
      console.log(`Scheduling follow-up task for meeting ID: ${meeting.id} with ${daysDelay} days delay`);
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysDelay);
      
      const taskDetails = {
        title: `Follow up with ${meeting.lead?.first_name} ${meeting.lead?.last_name}`,
        description: `Follow up on meeting: ${meeting.title}`,
        due_date: dueDate.toISOString()
      };
      
      // Check if meeting ID is valid
      if (!meeting.id) {
        throw new Error('Meeting ID is missing or invalid');
      }
      
      const { data, error } = await scheduleFollowUpTask(meeting.id.toString(), taskDetails);
      
      console.log('Schedule follow-up response:', { data, error });
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
      
      if (!data || !data.task_id) {
        console.error('Invalid response data:', data);
        throw new Error('Received invalid response data from the server');
      }
      
      toast.success('Follow-up task scheduled successfully');
      
      // Store the scheduled task details - use our local data since API only returns task_id
      setScheduledTaskDetails({
        task_id: data.task_id,
        scheduled_date: dueDate.toISOString(),
        title: taskDetails.title,
        description: taskDetails.description
      });
      
      // Show the task confirmation dialog
      setShowTaskConfirmation(true);
      
      // Don't close the follow-up dialog yet
      // setShowFollowUpDialog(false);
    } catch (error) {
      console.error('Error scheduling follow-up task:', error);
      
      // Get more detailed error information
      let errorMessage = 'Failed to schedule follow-up task';
      
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
        console.error('Error stack:', error.stack);
      }
      
      toast.error('Error', {
        description: errorMessage,
      });
    } finally {
      setIsSchedulingFollowUp(false);
    }
  };
  
  // Generate AI agenda suggestions
  const generateAgendaSuggestions = async () => {
    console.log('Generating agenda suggestions for meeting:', meeting);
    setIsLoadingAgendaSuggestions(true);
    try {
      const requestData = {
        lead_id: meeting.lead?.id?.toString(),
        meeting_type: meeting.meeting_type,
        context: meeting.description
      };
      console.log('Request data for agenda suggestions:', requestData);
      
      const { data, error } = await generateMeetingAgenda(requestData);
      
      console.log('Agenda API response:', { data, error });
      
      if (error) {
        // Check for authentication errors
        if (error.message?.includes('Unauthorized') || error.message?.includes('Authentication required')) {
          toast.error('Authentication Error', {
            description: 'Please log in to generate agenda suggestions',
          });
          return;
        }
        
        // Check for 404 errors
        if (error.message?.includes('not found') || error.message?.includes('404')) {
          toast.error('API Error', {
            description: 'The agenda API endpoint is not available. Using fallback agenda items.',
          });
          
          // Use fallback agenda items
          const fallbackItems = getFallbackAgendaItems(meeting.meeting_type);
          const updatedAgendaItems = [...(meeting.agenda_items || []), ...fallbackItems];
          
          try {
            const { data: updatedMeeting, error: updateError } = await updateMeeting(meeting.id.toString(), { 
              agenda_items: updatedAgendaItems
            } as MeetingUpdate);
            
            if (updateError) {
              throw new Error(updateError.message);
            }
            
            toast.success('Fallback agenda suggestions added');
            
            if (onUpdate && updatedMeeting) {
              onUpdate({...updatedMeeting, agenda_items: updatedAgendaItems} as EnhancedMeeting);
            }
            return;
          } catch (updateError) {
            console.error('Error updating meeting with fallback agenda items:', updateError);
            throw new Error('Failed to update meeting with fallback agenda items');
          }
        }
        
        throw new Error(error.message);
      }
      
      // Ensure meeting.agenda_items is initialized
      const currentAgendaItems = meeting.agenda_items || [];
      
      // Update the meeting with the suggested agenda items
      const updatedAgendaItems = [...currentAgendaItems, ...data.agenda_items];
      console.log('Updated agenda items:', updatedAgendaItems);
      
      const { data: updatedMeeting, error: updateError } = await updateMeeting(meeting.id.toString(), { 
        agenda_items: updatedAgendaItems
      } as MeetingUpdate);
      
      console.log('Meeting update response:', { updatedMeeting, updateError });
      
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      toast.success('AI agenda suggestions added');
      
      if (onUpdate && updatedMeeting) {
        onUpdate({...updatedMeeting, agenda_items: updatedAgendaItems} as EnhancedMeeting);
      }
    } catch (error) {
      console.error('Error generating agenda suggestions:', error);
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to generate agenda suggestions',
      });
    } finally {
      setIsLoadingAgendaSuggestions(false);
    }
  };
  
  // Generate comprehensive meeting summary
  const handleGenerateComprehensiveSummary = async () => {
    if (!meeting?.id) {
      toast.error("Error", {
        description: 'Meeting ID is required to generate a summary',
      });
      return;
    }

    setIsLoadingComprehensiveSummary(true);
    setComprehensiveSummaryError(null);

    try {
      toast.success("Generating Summary", {
        description: 'Generating comprehensive summary. This may take up to 30 seconds...',
      });

      console.log('Generating comprehensive summary for meeting:', meeting.id);
      
      // Create a timeout promise to prevent UI from hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
      });
      
      // Race between the API call and the timeout
      const result = await Promise.race([
        getComprehensiveMeetingSummary(meeting.id),
        timeoutPromise
      ]) as ApiResponse<any>;
      
      console.log('Comprehensive summary API response:', result);
      
      // Check if the response contains an error
      if (result.error) {
        console.error('Error from API response:', result.error);
        
        // Check if the error is an empty object
        if (typeof result.error === 'object' && Object.keys(result.error).length === 0) {
          console.log('Empty error object received, using fallback summary');
          throw new Error('Empty error response from API');
        }
        
        throw new Error(`API error: ${JSON.stringify(result.error)}`);
      }
      
      // Check if we have data
      if (!result.data) {
        console.error('No data returned from API');
        throw new Error('No data returned from API');
      }
      
      // Update the state with the comprehensive summary
      setComprehensiveSummary(result.data);
      
      toast.success('Comprehensive summary generated successfully!');
      
      // Set the active tab to summary
      setActiveTab('summary');
    } catch (error) {
      console.error('Error generating comprehensive summary:', error);
      
      // Create a fallback summary with generic content
      const fallbackSummary = {
        summary: "We couldn't generate a complete summary at this time. Here's a basic overview based on available information.",
        insights: ["Try reviewing the meeting details manually", "Consider scheduling a follow-up meeting"],
        action_items: ["Review meeting notes", "Follow up with the team"],
        next_steps: ["Schedule a follow-up meeting", "Document key decisions"],
        company_analysis: {
          company_summary: "Company information not available",
          industry: "Unknown",
          company_size_estimate: "Unknown",
          strengths: ["Not available"],
          potential_pain_points: ["Not available"]
        }
      };
      
      // Set the fallback summary
      setComprehensiveSummary(fallbackSummary);
      
      // Set a detailed error message
      let errorMessage = 'Failed to generate comprehensive summary.';
      
      if (error instanceof Error) {
        if (error.message.includes('timed out')) {
          errorMessage = 'The request timed out. The summary generation is taking longer than expected.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
          errorMessage = 'Authentication error. Please log in again and try.';
        } else if (error.message.includes('Empty error response')) {
          errorMessage = 'Could not connect to the summary service. Using fallback summary.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setComprehensiveSummaryError(errorMessage);
      toast.error('Error', {
        description: errorMessage,
      });
      
      // Still set the active tab to summary to show the fallback content
      setActiveTab('summary');
    } finally {
      setIsLoadingComprehensiveSummary(false);
    }
  };
  
  // Handle sending email directly
  const handleSendEmail = async () => {
    if (!meeting.lead?.email) {
      toast.error("No email address", {
        description: "This lead doesn't have an email address.",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      // Process attachments if any
      const processedAttachments = await Promise.all(
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
      
      // Call the email service to send the email
      const response = await sendEmail({
        to: meeting.lead.email,
        subject: editableSubject,
        content: editableMessage,
        lead_id: meeting.lead.id ? Number(meeting.lead.id) : undefined,
        attachments: processedAttachments,
      });
      
      toast.success('Email sent successfully', {
        description: `Your email to ${meeting.lead.email} has been sent.`,
      });
      
      // Close the dialog
      setShowFollowUpDialog(false);
      
      // Reset attachments
      setAttachments([]);
      
      // Log the activity
      console.log('Email sent:', {
        to: meeting.lead.email,
        subject: editableSubject,
        attachments: attachments.map(file => file.name),
      });
      
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email', {
        description: 'There was an error sending your email. Please try again.',
      });
    } finally {
      setIsSendingEmail(false);
    }
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
            <TabsTrigger value="summary">
              AI Summary
              {meetingSummary && <CheckCircle className="ml-1 h-3 w-3 text-green-500" />}
            </TabsTrigger>
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
                <ListChecks className="mr-1 h-4 w-4 text-blue-500" />
                {isLoadingAgendaSuggestions ? 'Generating...' : 'AI Agenda Suggestions'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={generateSummary}
                disabled={isLoadingSummary || !meeting.notes}
              >
                <Sparkles className="mr-1 h-4 w-4 text-blue-500" />
                {isLoadingSummary ? 'Generating...' : 'Generate AI Summary'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateComprehensiveSummary}
                disabled={isLoadingComprehensiveSummary}
              >
                <Sparkles className="mr-1 h-4 w-4 text-purple-500" />
                {isLoadingComprehensiveSummary ? 'Generating...' : 'Comprehensive AI Summary'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={generateFollowUp}
                disabled={isLoadingFollowUp}
              >
                <MessageSquare className="mr-1 h-4 w-4 text-blue-500" />
                {isLoadingFollowUp ? 'Generating...' : 'Generate Follow-up'}
              </Button>
              
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Close
                </Button>
              )}
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
          
          <TabsContent value="summary" className="overflow-x-auto styled-scrollbar min-w-full" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {isLoadingSummary || isLoadingComprehensiveSummary ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : comprehensiveSummary ? (
              <div className="space-y-4 overflow-x-auto overflow-y-visible flex flex-col">
                <div className="overflow-y-auto styled-scrollbar flex-grow" style={{ maxHeight: '50vh' }}>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Comprehensive Meeting Summary</h3>
                    <div className="p-3 bg-background border rounded-md text-sm overflow-x-auto whitespace-normal break-words text-foreground" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                      {comprehensiveSummary.summary}
                    </div>
                  </div>
                  
                  {comprehensiveSummary.insights && comprehensiveSummary.insights.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Key Insights</h3>
                      <ul className="space-y-2">
                        {comprehensiveSummary.insights.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-sm overflow-x-auto whitespace-normal break-words">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {comprehensiveSummary.action_items && comprehensiveSummary.action_items.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Action Items</h3>
                      <ul className="space-y-2">
                        {comprehensiveSummary.action_items.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-sm overflow-x-auto whitespace-normal break-words">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {comprehensiveSummary.next_steps && comprehensiveSummary.next_steps.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Recommended Next Steps</h3>
                      <ul className="space-y-2">
                        {comprehensiveSummary.next_steps.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-sm overflow-x-auto whitespace-normal break-words">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Add this section to display company analysis data in the comprehensive summary tab */}
                  {comprehensiveSummary?.company_analysis && (
                    <div className="mt-6 border-t pt-4">
                      <h3 className="text-sm font-medium mb-2">Company Analysis</h3>
                      
                      {comprehensiveSummary.company_analysis.company_summary && (
                        <div className="mb-3">
                          <h4 className="text-xs font-medium text-gray-500 mb-1">Company Summary</h4>
                          <p className="text-sm overflow-x-auto whitespace-normal break-words">{comprehensiveSummary.company_analysis.company_summary}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        {comprehensiveSummary.company_analysis.industry && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 mb-1">Industry</h4>
                            <p className="text-sm overflow-x-auto whitespace-normal break-words">{comprehensiveSummary.company_analysis.industry}</p>
                          </div>
                        )}
                        
                        {comprehensiveSummary.company_analysis.company_size_estimate && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 mb-1">Company Size</h4>
                            <p className="text-sm overflow-x-auto whitespace-normal break-words">{comprehensiveSummary.company_analysis.company_size_estimate}</p>
                          </div>
                        )}
                      </div>
                      
                      {comprehensiveSummary.company_analysis.strengths && comprehensiveSummary.company_analysis.strengths.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-xs font-medium text-gray-500 mb-1">Strengths</h4>
                          <ul className="space-y-1">
                            {comprehensiveSummary.company_analysis.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-green-500 mr-2 flex-shrink-0">•</span>
                                <span className="text-sm overflow-x-auto whitespace-normal break-words">{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {comprehensiveSummary.company_analysis.potential_pain_points && comprehensiveSummary.company_analysis.potential_pain_points.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-xs font-medium text-gray-500 mb-1">Potential Pain Points</h4>
                          <ul className="space-y-1">
                            {comprehensiveSummary.company_analysis.potential_pain_points.map((painPoint, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-amber-500 mr-2 flex-shrink-0">•</span>
                                <span className="text-sm overflow-x-auto whitespace-normal break-words">{painPoint}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Sticky footer with follow-up button */}
                <div className="sticky bottom-0 bg-background pt-2 pb-1 border-t mt-4 flex justify-end">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={generateFollowUp}
                    disabled={isLoadingFollowUp}
                    className="shadow-md hover:shadow-lg transition-all"
                  >
                    <MessageSquare className="mr-1 h-4 w-4" />
                    {isLoadingFollowUp ? 'Generating...' : 'Generate Follow-up'}
                  </Button>
                </div>
              </div>
            ) : meetingSummary ? (
              <div className="space-y-4 overflow-x-auto overflow-y-visible flex flex-col">
                <div className="overflow-y-auto styled-scrollbar flex-grow" style={{ maxHeight: '50vh' }}>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Meeting Summary</h3>
                    <div className="p-3 bg-background border rounded-md text-sm overflow-x-auto whitespace-normal break-words text-foreground" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                      {meetingSummary.summary}
                    </div>
                  </div>
                  
                  {meetingSummary.action_items.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Action Items</h3>
                      <ul className="space-y-2">
                        {meetingSummary.action_items.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-sm overflow-x-auto whitespace-normal break-words">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Sticky footer with follow-up button */}
                <div className="sticky bottom-0 bg-background pt-2 pb-1 border-t mt-4 flex justify-end">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={generateFollowUp}
                    disabled={isLoadingFollowUp}
                    className="shadow-md hover:shadow-lg transition-all"
                  >
                    <MessageSquare className="mr-1 h-4 w-4" />
                    {isLoadingFollowUp ? 'Generating...' : 'Generate Follow-up'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <Sparkles className="h-12 w-12 text-blue-200" />
                </div>
                <h3 className="text-lg font-medium mb-2">No AI Summary Yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Generate an AI-powered summary of this meeting to extract key points and action items.
                </p>
                <Button
                  onClick={generateSummary}
                  disabled={isLoadingSummary || !meeting.notes}
                >
                  {isLoadingSummary ? 'Generating...' : 'Generate Summary'}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Follow-up Dialog */}
      <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
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
                
                {/* File Attachments */}
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
      </Dialog>

      {/* Phone Dialog */}
      {meeting && meeting.lead && (
        <PhoneDialog
          open={showPhoneDialog}
          onOpenChange={setShowPhoneDialog}
          leadPhone={meeting.lead.phone}
          leadName={`${meeting.lead.first_name} ${meeting.lead.last_name}`}
          onSuccess={handlePhoneCallSuccess}
        />
      )}
      
      {/* Email Dialog */}
      {meeting && meeting.lead && (
        <EmailDialog
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          leadEmail={meeting.lead.email || ''}
          leadName={`${meeting.lead.first_name} ${meeting.lead.last_name}`}
          onSuccess={handleEmailSuccess}
        />
      )}
      
      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-auto styled-scrollbar">
          <DialogHeader>
            <DialogTitle>Reschedule Meeting</DialogTitle>
          </DialogHeader>
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
              onCancel={() => setShowRescheduleDialog(false)}
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
        </DialogContent>
      </Dialog>
    </Card>
  );
} 
// End of EnhancedMeetingDetails component 