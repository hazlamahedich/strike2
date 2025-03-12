import { useState, useEffect } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import { 
  Clock, MapPin, User, Calendar, FileText, 
  CheckCircle, XCircle, MessageSquare, Sparkles,
  ClipboardList, Send, ListChecks, Phone, Mail, X, AlertTriangle, ArrowRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

import { Meeting, MeetingStatus, MeetingUpdate } from '@/lib/types/meeting';
import { updateMeeting } from '@/lib/api/meetings';
import { ApiResponse } from '@/lib/api/apiClient';
import { 
  getMeetingSummaryAI as getMeetingSummary, 
  generateFollowUpMessage,
  scheduleFollowUpTask,
  generateMeetingAgenda,
  getComprehensiveMeetingSummary,
  updateMeetingWithSummary
} from '@/lib/services/aiMeetingService';
import { PhoneDialog } from '../communications/PhoneDialog';
import { EmailDialog } from '../communications/EmailDialog';
import { EnhancedMeetingForm } from './EnhancedMeetingForm';
import supabase from '@/lib/supabase/client';

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
  
  // Handle opening the phone dialog
  const handleOpenPhoneDialog = () => {
    if (meeting?.lead?.phone) {
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
    if (meeting?.lead?.email) {
      setShowEmailDialog(true);
    } else {
      toast({
        title: "No email address",
        description: "This lead doesn't have an email address.",
        variant: "destructive",
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
      if (meeting.lead?.id) {
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
          created_at: new Date().toISOString()
        };
        
        // Insert the activity into the activities table
        const { error } = await supabase.from('activities').insert(activityData);
        
        if (error) {
          console.error(`Error logging ${activityType} activity:`, error);
        } else {
          console.log(`${activityType} activity logged for meeting ${meeting.id}`);
        }
      }
    } catch (error) {
      console.error(`Error logging ${activityType} activity:`, error);
    }
  };
  
  // Handle reschedule success
  const handleRescheduleSuccess = (rescheduledMeeting: Meeting) => {
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
    
    // Log the activity
    logActivity('rescheduled', {
      new_start_time: rescheduledMeeting.start_time,
      new_end_time: rescheduledMeeting.end_time,
      new_location: rescheduledMeeting.location,
      new_meeting_type: rescheduledMeeting.meeting_type
    });
    
    toast({
      title: "Meeting Rescheduled",
      description: `Meeting has been rescheduled to ${format(parseISO(rescheduledMeeting.start_time), 'EEEE, MMMM d, yyyy h:mm a')}`,
    });
    
    setShowRescheduleDialog(false);
    
    // Close the meeting details dialog if onClose is provided
    if (onClose) {
      onClose();
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
      
      toast({
        title: 'Meeting Canceled',
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
      toast({
        title: 'Error',
        description: 'Failed to cancel the meeting',
        variant: 'destructive',
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
      
      toast({
        title: 'Marked as No-Show',
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
      toast({
        title: 'Error',
        description: 'Failed to mark the meeting as a no-show',
        variant: 'destructive',
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
  const [followUpMessage, setFollowUpMessage] = useState<{ subject: string; message: string } | null>(null);
  const [isLoadingFollowUp, setIsLoadingFollowUp] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState(false);
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
      const { data, error } = await updateMeeting(meeting.id.toString(), { 
        notes
      } as MeetingUpdate);
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: 'Success',
        description: 'Meeting notes saved successfully',
      });
      
      if (onUpdate && data) {
        onUpdate({...data, agenda_items: meeting.agenda_items} as EnhancedMeeting);
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save meeting notes',
        variant: 'destructive',
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
      
      toast({
        title: 'Success',
        description: 'Meeting marked as completed',
      });
      
      if (onUpdate && data) {
        onUpdate({...data, agenda_items: meeting.agenda_items} as EnhancedMeeting);
      }
    } catch (error) {
      console.error('Error updating meeting status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update meeting status',
        variant: 'destructive',
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
          toast({
            title: "Warning",
            description: "Summary generated but could not be saved to the meeting record.",
            variant: "destructive"
          });
        } else if (onUpdate && updatedMeeting) {
          // Preserve existing comprehensive summary if present
          const updatedMeetingWithComprehensive = {
            ...updatedMeeting,
            comprehensive_summary: meeting.comprehensive_summary,
            agenda_items: meeting.agenda_items
          };
          onUpdate(updatedMeetingWithComprehensive as EnhancedMeeting);
          
          toast({
            title: "Success",
            description: "Summary generated and saved.",
            variant: "default"
          });
        }
      } catch (innerError) {
        console.error('Error saving summary to meeting:', innerError);
        toast({
          title: "Warning",
          description: "Summary generated but could not be saved to the meeting record.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating meeting summary:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate meeting summary',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };
  
  // Generate follow-up message
  const generateFollowUp = async () => {
    setIsLoadingFollowUp(true);
    try {
      const { data, error } = await generateFollowUpMessage(meeting.id.toString());
      
      if (error) {
        throw new Error(error.message);
      }
      
      setFollowUpMessage(data);
      setShowFollowUpDialog(true);
    } catch (error) {
      console.error('Error generating follow-up message:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate follow-up message',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingFollowUp(false);
    }
  };
  
  // Schedule follow-up task
  const scheduleFollowUp = async (daysDelay: number = 3) => {
    setIsSchedulingFollowUp(true);
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysDelay);
      
      const taskDetails = {
        title: `Follow up with ${meeting.lead?.first_name} ${meeting.lead?.last_name}`,
        description: `Follow up on meeting: ${meeting.title}`,
        due_date: dueDate.toISOString()
      };
      
      const { data, error } = await scheduleFollowUpTask(meeting.id.toString(), taskDetails);
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: 'Success',
        description: 'Follow-up task scheduled successfully',
      });
      
      setShowFollowUpDialog(false);
    } catch (error) {
      console.error('Error scheduling follow-up task:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule follow-up task',
        variant: 'destructive',
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
      
      toast({
        title: 'Success',
        description: 'AI agenda suggestions added',
      });
      
      if (onUpdate && updatedMeeting) {
        onUpdate({...updatedMeeting, agenda_items: updatedAgendaItems} as EnhancedMeeting);
      }
    } catch (error) {
      console.error('Error generating agenda suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate agenda suggestions',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAgendaSuggestions(false);
    }
  };
  
  // Generate comprehensive meeting summary
  const handleGenerateComprehensiveSummary = async () => {
    if (!meeting?.id) {
      toast({
        title: "Error",
        description: 'Meeting ID is required to generate a summary',
        variant: "destructive",
      });
      return;
    }

    setIsLoadingComprehensiveSummary(true);
    setComprehensiveSummaryError(null);

    try {
      toast({
        title: "Generating Summary",
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
      
      toast({
        title: "Success",
        description: 'Comprehensive summary generated successfully!',
      });
      
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
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Still set the active tab to summary to show the fallback content
      setActiveTab('summary');
    } finally {
      setIsLoadingComprehensiveSummary(false);
    }
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
                    {format(parseISO(meeting.start_time), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Clock className="mr-2 h-4 w-4 opacity-70" />
                  <span>
                    {format(parseISO(meeting.start_time), 'h:mm a')} - {format(parseISO(meeting.end_time), 'h:mm a')}
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
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter meeting notes here..."
                className="min-h-[200px]"
              />
              
              <div className="flex justify-end">
                <Button 
                  onClick={saveNotes} 
                  disabled={isLoading || notes === meeting.notes}
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
                    <div className="p-3 bg-gray-50 rounded-md text-sm overflow-x-auto whitespace-normal break-words" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
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
                <div className="sticky bottom-0 bg-white pt-2 pb-1 border-t mt-4 flex justify-end">
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
                    <div className="p-3 bg-gray-50 rounded-md text-sm overflow-x-auto whitespace-normal break-words">
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
                <div className="sticky bottom-0 bg-white pt-2 pb-1 border-t mt-4 flex justify-end">
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
          ) : followUpMessage ? (
            <div className="space-y-4 overflow-x-auto">
              <div className="overflow-y-auto styled-scrollbar" style={{ maxHeight: '60vh' }}>
                <div>
                  <h3 className="text-sm font-medium mb-2">Subject</h3>
                  <div className="p-3 bg-gray-50 rounded-md text-sm overflow-x-auto whitespace-normal break-words">
                    {followUpMessage.subject}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Message</h3>
                  <div className="p-3 bg-gray-50 rounded-md text-sm whitespace-pre-line overflow-x-auto break-words">
                    {followUpMessage.message}
                  </div>
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
                >
                  <Send className="mr-1 h-4 w-4" />
                  Send Email
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
                    toast({
                      title: 'Error',
                      description: 'Failed to reschedule the meeting',
                      variant: 'destructive',
                    });
                    return;
                  }
                  
                  // Call the handleRescheduleSuccess function with the updated meeting
                  handleRescheduleSuccess(rescheduledMeeting);
                });
              }}
              onCancel={() => setShowRescheduleDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
} 
// End of EnhancedMeetingDetails component 