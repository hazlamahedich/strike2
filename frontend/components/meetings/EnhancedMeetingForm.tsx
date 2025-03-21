import { useState, useEffect, useRef, useCallback } from 'react';
import { format, parseISO, addMinutes } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Calendar, Search, User, Plus, Sparkles, Phone, Mail, X, Clock, Info } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Lead } from '@/types/lead';
import { Meeting, MeetingType, MeetingStatus, MeetingCreate } from '@/lib/types/meeting';
import { createMeeting } from '@/lib/api/meetings';
import { cn } from '@/lib/utils';
import { toZonedTime } from 'date-fns-tz';
import { CalendarIntegration } from '@/components/leads/CalendarIntegration';

// Define TimeSlot interface if not already imported
interface TimeSlot {
  start_time: string;
  end_time: string;
  score?: number;
}

// Define interfaces for AI suggestion API responses
interface DurationResponse {
  duration_minutes: number;
}

interface AgendaResponse {
  agenda_items: string[];
}

interface AvailabilityRequest {
  lead_id?: string;
  meeting_type: string;
  preferred_days?: string[];
  preferred_times?: string[];
  days_ahead?: number;
}

interface AvailabilityResponse {
  available_slots: TimeSlot[];
  timezone?: string;
}

// Mock API functions
const getRecommendedDuration = async (meetingType: string, leadId: string): Promise<{data: DurationResponse | null, error: Error | null}> => {
  return { data: null, error: null };
};

const generateMeetingAgenda = async (meetingType: string, leadId: string): Promise<{data: AgendaResponse | null, error: Error | null}> => {
  return { data: null, error: null };
};

const getSuggestedMeetingTimes = async (request: AvailabilityRequest): Promise<{data: AvailabilityResponse | null, error: Error | null}> => {
  try {
    console.log('Fetching suggested meeting times:', request);
    
    // In a real implementation, call the API
    const response = await fetch('/api/v1/ai/meetings/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get suggested meeting times: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return { data, error: null };
  } catch (error) {
    console.error('Error getting suggested meeting times:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
};

const formSchema = z.object({
  lead_id: z.string().min(1, 'Contact is required'),
  lead_email: z.string().email('Invalid email').optional().or(z.literal('')),
  lead_phone: z.string().optional().or(z.literal('')),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  meeting_type: z.nativeEnum(MeetingType, {
    required_error: 'Please select a meeting type',
  }),
  to_emails: z.array(z.string().email('Invalid email')).default([]),
  cc_emails: z.array(z.string().email('Invalid email')).default([]),
  bcc_emails: z.array(z.string().email('Invalid email')).default([]),
  location: z.string().optional(),
  location_type: z.string().default('virtual'),
  use_ai_suggestions: z.boolean().default(false),
  agenda_items: z.array(z.string()).default([]),
  timezone: z.string().default(Intl.DateTimeFormat().resolvedOptions().timeZone),
});

export interface EnhancedMeetingFormProps {
  leadOptions?: Lead[];
  initialTimeSlot?: TimeSlot | null;
  initialValues?: {
    lead_id?: string;
    lead_email?: string;
    lead_phone?: string;
    title?: string;
  };
  onSuccess?: (meeting: Meeting) => void;
  onCancel?: () => void;
  onCallContact?: (lead: Lead) => void;
  onSendEmail?: (lead: Lead) => void;
  onError?: (error: Error) => void;
}

// Mock data for AI suggestions
const MOCK_SUGGESTED_DURATION = 45; // 45 minutes
const MOCK_SUGGESTED_AGENDA = [
  "Introduction and rapport building",
  "Overview of product features and benefits",
  "Discussion of client's specific needs",
  "Demonstration of relevant features",
  "Q&A session",
  "Next steps and follow-up plan"
];
const MOCK_SUGGESTED_TIMESLOTS = [
  {
    start_time: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(10, 0, 0, 0),
    end_time: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(11, 0, 0, 0),
  },
  {
    start_time: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(14, 30, 0, 0),
    end_time: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(15, 30, 0, 0),
  },
  {
    start_time: new Date(new Date().setDate(new Date().getDate() + 2)).setHours(11, 0, 0, 0),
    end_time: new Date(new Date().setDate(new Date().getDate() + 2)).setHours(12, 0, 0, 0),
  },
  {
    start_time: new Date(new Date().setDate(new Date().getDate() + 3)).setHours(9, 0, 0, 0),
    end_time: new Date(new Date().setDate(new Date().getDate() + 3)).setHours(10, 0, 0, 0),
  }
].map(slot => ({
  start_time: new Date(slot.start_time).toISOString(),
  end_time: new Date(slot.end_time).toISOString()
}));

// Formats a date in the specified timezone
const formatInTimezone = (date: string, timezone: string, formatStr: string): string => {
  try {
    // Convert the date to the specified timezone
    const dateObj = new Date(date);
    const zonedDate = toZonedTime(dateObj, timezone);
    return format(zonedDate, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return format(new Date(date), formatStr);
  }
};

export function EnhancedMeetingForm({
  leadOptions = [],
  initialTimeSlot = null,
  initialValues,
  onSuccess,
  onCancel,
  onCallContact,
  onSendEmail,
  onError
}: EnhancedMeetingFormProps) {
  // Basic state
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(
    leadOptions && leadOptions.length > 0 ? leadOptions[0] : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [useAiSuggestions, setUseAiSuggestions] = useState(false);
  
  // AI suggestions state
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false);
  const [suggestedDuration, setSuggestedDuration] = useState<number | null>(null);
  const [suggestedAgendaItems, setSuggestedAgendaItems] = useState<string[]>([]);
  const [suggestedTimeSlots, setSuggestedTimeSlots] = useState<TimeSlot[]>([]);
  
  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Calendar integration state
  const [showCalendarIntegration, setShowCalendarIntegration] = useState(false);
  const [hasCalendarIntegration, setHasCalendarIntegration] = useState(false);
  
  // Add email management functions
  const [toInput, setToInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');

  // Add new state for email suggestions
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [activeEmailField, setActiveEmailField] = useState<'to' | 'cc' | 'bcc' | null>(null);
  const emailSuggestionsRef = useRef<HTMLDivElement>(null);

  // Form setup with initialValues from props if provided
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lead_id: initialValues?.lead_id || selectedLead?.id?.toString() || '',
      lead_email: initialValues?.lead_email || selectedLead?.email || '',
      lead_phone: initialValues?.lead_phone || selectedLead?.phone || '',
      title: initialValues?.title || (selectedLead ? `Meeting with ${selectedLead.first_name || ''} ${selectedLead.last_name || ''}`.trim() : ''),
      description: '',
      date: initialTimeSlot ? format(parseISO(initialTimeSlot.start_time), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      start_time: initialTimeSlot ? format(parseISO(initialTimeSlot.start_time), 'HH:mm') : '09:00',
      end_time: initialTimeSlot ? format(parseISO(initialTimeSlot.end_time), 'HH:mm') : '10:00',
      meeting_type: MeetingType.INITIAL_CALL,
      to_emails: [],
      cc_emails: [],
      bcc_emails: [],
      location: '',
      location_type: 'virtual',
      use_ai_suggestions: false,
      agenda_items: [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
  
  // Initialize form with lead data from props (if available)
  useEffect(() => {
    if (leadOptions && leadOptions.length > 0) {
      const lead = leadOptions[0];
      console.log('Setting initial lead data:', lead);
      setSelectedLead(lead);
      
      // Apply explicit initialValues if provided, otherwise use lead data
      form.setValue('lead_id', initialValues?.lead_id || lead.id.toString());
      form.setValue('lead_email', initialValues?.lead_email || lead.email || '');
      form.setValue('lead_phone', initialValues?.lead_phone || lead.phone || '');
      
      // Set default meeting title based on lead name or initialValues
      if (initialValues?.title) {
        form.setValue('title', initialValues.title);
      } else if (lead.first_name || lead.last_name) {
        const defaultTitle = `Meeting with ${lead.first_name || ''} ${lead.last_name || ''}`.trim();
        form.setValue('title', defaultTitle);
      }
    } else if (initialValues) {
      // If no leadOptions but initialValues provided, use those
      if (initialValues.lead_id) form.setValue('lead_id', initialValues.lead_id);
      if (initialValues.lead_email) form.setValue('lead_email', initialValues.lead_email);
      if (initialValues.lead_phone) form.setValue('lead_phone', initialValues.lead_phone);
      if (initialValues.title) form.setValue('title', initialValues.title);
    }
  }, [leadOptions, initialValues, form]);
  
  // Filter leads based on search query - ensure it's always an array
  const filteredLeads = Array.isArray(leadOptions) 
    ? (searchQuery.trim() === '' 
        ? leadOptions 
        : leadOptions.filter(lead => {
            const query = searchQuery.toLowerCase();
            return (
              (lead.first_name || '').toLowerCase().includes(query) ||
              (lead.last_name || '').toLowerCase().includes(query) ||
              (lead.email || '').toLowerCase().includes(query) ||
              (lead.company || '').toLowerCase().includes(query)
            );
          }))
    : [];
  
  // Handle lead selection
  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    form.setValue('lead_id', lead.id.toString());
    form.setValue('lead_email', lead.email || '');
    form.setValue('lead_phone', lead.phone || '');
    setShowDropdown(false);
  };
  
  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Load recommended duration when meeting type or lead changes
  const loadRecommendedDuration = useCallback(async (meetingType: string, leadId: string) => {
    if (!useAiSuggestions) return;
    
    setIsLoadingAiSuggestions(true);
    try {
      // Use mock data instead of API call
      setTimeout(() => {
        setSuggestedDuration(MOCK_SUGGESTED_DURATION);
        
        // Update end time based on suggested duration
        const startTime = form.getValues('start_time');
        if (startTime) {
          const [hours, minutes] = startTime.split(':').map(Number);
          const startDate = new Date();
          startDate.setHours(hours, minutes, 0, 0);
          
          const endDate = addMinutes(startDate, MOCK_SUGGESTED_DURATION);
          const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
          
          form.setValue('end_time', endTime);
        }
        setIsLoadingAiSuggestions(false);
      }, 1000); // Simulate API delay
    } catch (error) {
      console.error('Error loading recommended duration:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI suggestions for duration',
        variant: 'destructive',
      });
      setIsLoadingAiSuggestions(false);
    }
  }, [form, useAiSuggestions]);

  // Load suggested agenda items
  const loadSuggestedAgenda = useCallback(async (meetingType: string, leadId: string) => {
    if (!useAiSuggestions) return;
    
    setIsLoadingAiSuggestions(true);
    try {
      // Use mock data instead of API call
      setTimeout(() => {
        setSuggestedAgendaItems(MOCK_SUGGESTED_AGENDA);
        form.setValue('agenda_items', MOCK_SUGGESTED_AGENDA);
        setIsLoadingAiSuggestions(false);
      }, 1500); // Simulate API delay
    } catch (error) {
      console.error('Error loading suggested agenda:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI suggestions for agenda',
        variant: 'destructive',
      });
      setIsLoadingAiSuggestions(false);
    }
  }, [form, useAiSuggestions]);

  // Load suggested time slots
  const loadSuggestedTimeSlots = useCallback(async (meetingType: string, leadId: string) => {
    if (!meetingType || !leadId) {
      setSuggestedTimeSlots([]);
      return;
    }
    
    setIsLoadingAiSuggestions(true);
    try {
      const { data, error } = await getSuggestedMeetingTimes({
        lead_id: leadId,
        meeting_type: meetingType,
        days_ahead: 7,
      });
      
      if (error) {
        throw error;
      }
      
      setSuggestedTimeSlots(data?.available_slots || []);
      // Store the timezone returned from the API
      if (data?.timezone) {
        form.setValue('timezone', data.timezone);
      }
    } catch (error) {
      console.error('Error getting suggested meeting times:', error);
      setSuggestedTimeSlots(MOCK_SUGGESTED_TIMESLOTS);
    } finally {
      setIsLoadingAiSuggestions(false);
    }
  }, []);

  // Use a separate effect for loading recommendations to avoid infinite loops
  useEffect(() => {
    if (!selectedLead?.id || !form.getValues('meeting_type')) return;
    
    if (useAiSuggestions) {
      const meetingType = form.getValues('meeting_type');
      const leadId = selectedLead.id.toString();
      
      const timer = setTimeout(() => {
        loadRecommendedDuration(meetingType, leadId);
        loadSuggestedAgenda(meetingType, leadId);
        loadSuggestedTimeSlots(meetingType, leadId);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [form, selectedLead?.id, useAiSuggestions, loadRecommendedDuration, loadSuggestedAgenda, loadSuggestedTimeSlots]);
  
  // Show calendar integration when a lead is selected
  useEffect(() => {
    setShowCalendarIntegration(!!selectedLead?.id);
  }, [selectedLead?.id]);
  
  // Handle calendar integration changes
  const handleCalendarIntegrationChange = (isConnected: boolean) => {
    setHasCalendarIntegration(isConnected);
    if (isConnected && selectedLead?.id) {
      // If calendar is connected, refresh suggested time slots
      loadSuggestedTimeSlots(form.getValues('meeting_type'), selectedLead.id);
    }
  };
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedLead) {
      console.error('[EnhancedMeetingForm] Cannot submit form - no selected lead');
      return;
    }
    
    console.log('[EnhancedMeetingForm] Submitting form with values:', values);
    setIsLoading(true);
    
    try {
      const date = values.date;
      const startTime = values.start_time;
      const endTime = values.end_time;
      
      // Create start and end datetime strings
      const startDateTime = `${date}T${startTime}:00`;
      const endDateTime = `${date}T${endTime}:00`;
      
      // Prepare meeting data
      const meetingData: MeetingCreate = {
        title: values.title,
        description: values.description || '',
        start_time: startDateTime,
        end_time: endDateTime,
        meeting_type: values.meeting_type,
        location: values.location || 'Virtual',
        lead_id: values.lead_id,
        lead_email: values.lead_email || '',
        status: MeetingStatus.SCHEDULED,
        // Include email data
        attendees: [
          { email: values.lead_email || '', role: 'primary' as const },
          ...values.to_emails.map(email => ({ email, role: 'to' as const })),
          ...values.cc_emails.map(email => ({ email, role: 'cc' as const })),
          ...values.bcc_emails.map(email => ({ email, role: 'bcc' as const }))
        ]
      };
      
      // Log the meeting data for debugging
      console.log('[EnhancedMeetingForm] Submitting meeting with data:', meetingData);
      
      // Create the meeting
      console.log('[EnhancedMeetingForm] Calling createMeeting API');
      const response = await createMeeting(meetingData);
      
      // Handle API response
      console.log('[EnhancedMeetingForm] API response received:', response);
      
      if (response.error) {
        console.error('[EnhancedMeetingForm] API returned error:', response.error);
        throw new Error(response.error.message || 'Failed to create meeting');
      }
      
      // Show success toast
      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      });
      
      // Call onSuccess callback with created meeting
      if (onSuccess && response.data) {
        console.log('[EnhancedMeetingForm] Success - calling onSuccess callback');
        onSuccess(response.data);
      }
      
    } catch (error) {
      console.error('[EnhancedMeetingForm] Error scheduling meeting:', error);
      
      let errorMessage = 'Failed to schedule meeting';
      
      // Try to extract a more specific error message
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Show error toast
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Call onError callback if provided
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add this function to handle time slot selection
  const handleSelectTimeSlot = (timeSlot: TimeSlot) => {
    const date = format(parseISO(timeSlot.start_time), 'yyyy-MM-dd');
    const startTime = format(parseISO(timeSlot.start_time), 'HH:mm');
    const endTime = format(parseISO(timeSlot.end_time), 'HH:mm');
    
    form.setValue('date', date);
    form.setValue('start_time', startTime);
    form.setValue('end_time', endTime);
  };

  // Add contact action buttons
  const handleCallContact = () => {
    if (selectedLead && onCallContact) {
      onCallContact(selectedLead);
    } else if (selectedLead?.phone) {
      toast({
        title: "Call Contact",
        description: `Would call ${selectedLead.first_name} at ${selectedLead.phone}`,
      });
    } else {
      toast({
        title: "No phone number",
        description: "This contact doesn't have a phone number.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = () => {
    if (selectedLead && onSendEmail) {
      onSendEmail(selectedLead);
    } else if (selectedLead?.email) {
      toast({
        title: "Send Email",
        description: `Would email ${selectedLead.first_name} at ${selectedLead.email}`,
      });
    } else {
      toast({
        title: "No email address",
        description: "This contact doesn't have an email address.",
        variant: "destructive",
      });
    }
  };

  // Add email management functions
  const addEmail = (type: 'to' | 'cc' | 'bcc', email: string) => {
    if (!email || !email.includes('@')) return;
    
    const emailValue = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(emailValue)) {
      toast({
        title: 'Invalid email',
        description: `${emailValue} is not a valid email address`,
        variant: 'destructive',
      });
      return;
    }
    
    if (type === 'to') {
      const currentEmails = form.getValues('to_emails');
      if (!currentEmails.includes(emailValue)) {
        form.setValue('to_emails', [...currentEmails, emailValue]);
        setToInput('');
      }
    } else if (type === 'cc') {
      const currentEmails = form.getValues('cc_emails');
      if (!currentEmails.includes(emailValue)) {
        form.setValue('cc_emails', [...currentEmails, emailValue]);
        setCcInput('');
      }
    } else if (type === 'bcc') {
      const currentEmails = form.getValues('bcc_emails');
      if (!currentEmails.includes(emailValue)) {
        form.setValue('bcc_emails', [...currentEmails, emailValue]);
        setBccInput('');
      }
    }
  };

  const removeEmail = (type: 'to' | 'cc' | 'bcc', email: string) => {
    if (type === 'to') {
      const currentEmails = form.getValues('to_emails');
      form.setValue('to_emails', currentEmails.filter(e => e !== email));
    } else if (type === 'cc') {
      const currentEmails = form.getValues('cc_emails');
      form.setValue('cc_emails', currentEmails.filter(e => e !== email));
    } else if (type === 'bcc') {
      const currentEmails = form.getValues('bcc_emails');
      form.setValue('bcc_emails', currentEmails.filter(e => e !== email));
    }
  };

  // Add this function to filter email suggestions based on input
  const getEmailSuggestions = useCallback((input: string) => {
    if (!input || input.length < 2) return [];
    
    // Example email addresses - in a real app, these would come from an API or context
    const commonEmails = [
      'sales@example.com',
      'support@example.com',
      'info@example.com',
      'john.doe@example.com',
      'jane.smith@example.com',
      'marketing@example.com',
      'hr@example.com',
      'finance@example.com'
    ];
    
    // Add emails from existing leads if available
    const leadEmails = leadOptions
      .filter(lead => lead.email)
      .map(lead => `${lead.first_name} ${lead.last_name} <${lead.email}>`)
      .filter(Boolean);
    
    const allPossibleEmails = [...commonEmails, ...leadEmails];
    
    // Filter for matches
    return allPossibleEmails.filter(email => 
      email.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5); // Limit to 5 suggestions
  }, [leadOptions]);

  // Function to handle email input changes with suggestions
  const handleEmailInputChange = (type: 'to' | 'cc' | 'bcc', value: string) => {
    if (type === 'to') {
      setToInput(value);
    } else if (type === 'cc') {
      setCcInput(value);
    } else {
      setBccInput(value);
    }
    
    // Update suggestions
    setEmailSuggestions(getEmailSuggestions(value));
    setShowEmailSuggestions(true);
    setActiveEmailField(type);
  };

  // Function to select an email suggestion
  const selectEmailSuggestion = (email: string) => {
    if (!activeEmailField) return;
    
    // Extract just the email part if in the format "Name <email>"
    const extractedEmail = email.includes('<') ? 
      email.match(/<([^>]+)>/)![1] : 
      email;
    
    addEmail(activeEmailField, extractedEmail);
    setShowEmailSuggestions(false);
  };

  // Handle click outside for email suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emailSuggestionsRef.current && !emailSuggestionsRef.current.contains(event.target as Node)) {
        setShowEmailSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Replace the SuggestedTimeSlots component with this updated version:
  const SuggestedTimeSlots = ({ 
    slots, 
    timezone, 
    onSelectSlot 
  }: { 
    slots: TimeSlot[], 
    timezone: string,
    onSelectSlot: (slot: TimeSlot) => void 
  }) => {
    if (!slots || slots.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          No suggested time slots available
        </div>
      );
    }

    // Get the user's local timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const showBothTimezones = userTimezone !== timezone;

    return (
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground mb-2">
          <Clock className="inline-block w-4 h-4 mr-1" />
          Showing times in timezone: <span className="font-medium">{timezone}</span>
          {showBothTimezones && (
            <span className="ml-1">(Your timezone: <span className="font-medium">{userTimezone}</span>)</span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2">
          {slots.map((slot, index) => {
            const startTime = new Date(slot.start_time);
            const endTime = new Date(slot.end_time);
            
            // Format the date and time in the lead's timezone
            const dateStr = formatInTimezone(slot.start_time, timezone, 'EEE, MMM d, yyyy');
            const timeStr = `${formatInTimezone(slot.start_time, timezone, 'h:mm a')} - ${formatInTimezone(slot.end_time, timezone, 'h:mm a')}`;
            
            // Also format time in user's timezone if different
            let userTimeStr = '';
            if (showBothTimezones) {
              userTimeStr = `${formatInTimezone(slot.start_time, userTimezone, 'h:mm a')} - ${formatInTimezone(slot.end_time, userTimezone, 'h:mm a')}`;
            }
            
            return (
              <Button
                key={index}
                variant="outline"
                className={cn(
                  "flex justify-between items-center p-3 h-auto",
                  (slot.score && slot.score > 0.8) && "border-green-400 border-2"
                )}
                onClick={() => onSelectSlot(slot)}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{dateStr}</span>
                  <span className="text-sm text-muted-foreground">{timeStr}</span>
                  {showBothTimezones && (
                    <span className="text-xs text-blue-500">Your time: {userTimeStr}</span>
                  )}
                </div>
                {slot.score && slot.score > 0.8 && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Recommended
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center justify-between">
              <span>Schedule Meeting</span>
              <div className="flex items-center space-x-2">
                <div 
                  className={`h-4 w-4 rounded-sm border cursor-pointer flex items-center justify-center ${
                    useAiSuggestions ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  onClick={() => {
                    const newValue = !useAiSuggestions;
                    setUseAiSuggestions(newValue);
                    form.setValue('use_ai_suggestions', newValue);
                  }}
                >
                  {useAiSuggestions && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <label
                  className="text-sm font-medium flex items-center cursor-pointer dark:text-gray-100"
                  onClick={() => {
                    const newValue = !useAiSuggestions;
                    setUseAiSuggestions(newValue);
                    form.setValue('use_ai_suggestions', newValue);
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-1 text-blue-500" />
                  Use AI Suggestions
                </label>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Contact Search - Simple Implementation */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Contact</label>
                    {selectedLead && (
                      <div className="flex space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCallContact}
                          className="h-8 px-2 text-xs"
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={handleSendEmail}
                          className="h-8 px-2 text-xs"
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="relative" ref={dropdownRef}>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => {
                          setShowDropdown(true);
                          if (selectedLead) {
                            setSearchQuery(`${selectedLead.first_name} ${selectedLead.last_name}`.trim());
                          }
                        }}
                        className="w-full dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50 dark:text-gray-400" />
                    </div>
                    
                    {selectedLead && !showDropdown && (
                      <div className="flex items-center mt-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{selectedLead.first_name} {selectedLead.last_name}</span>
                        {selectedLead.company && (
                          <Badge variant="outline" className="ml-2 dark:border-gray-600 dark:text-gray-300">
                            {selectedLead.company}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {showDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200 dark:border-gray-700">
                        {filteredLeads.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No contacts found.</div>
                        ) : (
                          <div className="py-1">
                            {filteredLeads.map((lead) => (
                              <div
                                key={lead.id}
                                className={`px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between text-gray-900 dark:text-gray-100 ${selectedLead?.id === lead.id ? 'bg-primary/10' : ''}`}
                                onClick={() => handleSelectLead(lead)}
                              >
                                <div className="flex items-center">
                                  <User className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                                  <span>{lead.first_name} {lead.last_name}</span>
                                </div>
                                {lead.company && (
                                  <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">{lead.company}</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="lead_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly={!!selectedLead?.email} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* To Email Field */}
                <div className="space-y-2">
                  <FormLabel>To</FormLabel>
                  <div className="flex items-center space-x-2 relative">
                    <Input
                      type="email"
                      placeholder="Add recipient email..."
                      value={toInput}
                      onChange={(e) => handleEmailInputChange('to', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addEmail('to', toInput);
                          setShowEmailSuggestions(false);
                        }
                      }}
                      onFocus={() => {
                        setActiveEmailField('to');
                        if (toInput.length >= 2) {
                          setEmailSuggestions(getEmailSuggestions(toInput));
                          setShowEmailSuggestions(true);
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        addEmail('to', toInput);
                        setShowEmailSuggestions(false);
                      }}
                    >
                      Add
                    </Button>
                    
                    {/* Email suggestions dropdown */}
                    {showEmailSuggestions && activeEmailField === 'to' && emailSuggestions.length > 0 && (
                      <div 
                        ref={emailSuggestionsRef} 
                        className="absolute z-10 top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200 dark:border-gray-700"
                      >
                        {emailSuggestions.map((email, index) => (
                          <div
                            key={index}
                            className="px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => selectEmailSuggestion(email)}
                          >
                            {email}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch('to_emails').map((email) => (
                      <Badge 
                        key={email} 
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {email}
                        <button 
                          type="button" 
                          className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
                          onClick={() => removeEmail('to', email)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* CC Email Field */}
                <div className="space-y-2">
                  <FormLabel>CC</FormLabel>
                  <div className="flex items-center space-x-2 relative">
                    <Input
                      type="email"
                      placeholder="Add CC email..."
                      value={ccInput}
                      onChange={(e) => handleEmailInputChange('cc', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addEmail('cc', ccInput);
                          setShowEmailSuggestions(false);
                        }
                      }}
                      onFocus={() => {
                        setActiveEmailField('cc');
                        if (ccInput.length >= 2) {
                          setEmailSuggestions(getEmailSuggestions(ccInput));
                          setShowEmailSuggestions(true);
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        addEmail('cc', ccInput);
                        setShowEmailSuggestions(false);
                      }}
                    >
                      Add
                    </Button>
                    
                    {/* Email suggestions dropdown */}
                    {showEmailSuggestions && activeEmailField === 'cc' && emailSuggestions.length > 0 && (
                      <div 
                        ref={emailSuggestionsRef} 
                        className="absolute z-10 top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200 dark:border-gray-700"
                      >
                        {emailSuggestions.map((email, index) => (
                          <div
                            key={index}
                            className="px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => selectEmailSuggestion(email)}
                          >
                            {email}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch('cc_emails').map((email) => (
                      <Badge 
                        key={email} 
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {email}
                        <button 
                          type="button" 
                          className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
                          onClick={() => removeEmail('cc', email)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* BCC Email Field */}
                <div className="space-y-2">
                  <FormLabel>BCC</FormLabel>
                  <div className="flex items-center space-x-2 relative">
                    <Input
                      type="email"
                      placeholder="Add BCC email..."
                      value={bccInput}
                      onChange={(e) => handleEmailInputChange('bcc', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addEmail('bcc', bccInput);
                          setShowEmailSuggestions(false);
                        }
                      }}
                      onFocus={() => {
                        setActiveEmailField('bcc');
                        if (bccInput.length >= 2) {
                          setEmailSuggestions(getEmailSuggestions(bccInput));
                          setShowEmailSuggestions(true);
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        addEmail('bcc', bccInput);
                        setShowEmailSuggestions(false);
                      }}
                    >
                      Add
                    </Button>
                    
                    {/* Email suggestions dropdown */}
                    {showEmailSuggestions && activeEmailField === 'bcc' && emailSuggestions.length > 0 && (
                      <div 
                        ref={emailSuggestionsRef} 
                        className="absolute z-10 top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200 dark:border-gray-700"
                      >
                        {emailSuggestions.map((email, index) => (
                          <div
                            key={index}
                            className="px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => selectEmailSuggestion(email)}
                          >
                            {email}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch('bcc_emails').map((email) => (
                      <Badge 
                        key={email} 
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {email}
                        <button 
                          type="button" 
                          className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
                          onClick={() => removeEmail('bcc', email)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="lead_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly={!!selectedLead?.phone} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter meeting title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="meeting_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Type</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          >
                            <option value="" disabled>Select meeting type</option>
                            <option value={MeetingType.INITIAL_CALL}>Initial Call</option>
                            <option value={MeetingType.DISCOVERY}>Discovery</option>
                            <option value={MeetingType.DEMO}>Product Demo</option>
                            <option value={MeetingType.PROPOSAL}>Proposal Review</option>
                            <option value={MeetingType.FOLLOW_UP}>Follow-up</option>
                            <option value={MeetingType.OTHER}>Other</option>
                          </select>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter meeting description"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter meeting location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="date"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="end_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          {suggestedDuration && useAiSuggestions && (
                            <div className="text-xs text-blue-500 flex items-center mt-1">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI suggests {suggestedDuration} minutes
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Calendar Integration */}
                {selectedLead?.id && showCalendarIntegration && (
                  <div className="mt-4 mb-4">
                    <CalendarIntegration 
                      leadId={selectedLead.id} 
                      onIntegrationChange={handleCalendarIntegrationChange} 
                    />
                    
                    {hasCalendarIntegration && (
                      <div className="flex items-center mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                        <Info className="h-4 w-4 mr-2 text-blue-500" />
                        <span>Suggested times will exclude times when the lead is busy according to their calendar.</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* AI Suggested Time Slots */}
                {useAiSuggestions && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <Sparkles className="h-4 w-4 mr-1 text-blue-500" />
                      AI Suggested Time Slots
                    </h4>
                    
                    {isLoadingAiSuggestions && (
                      <div className="text-center py-4">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-r-transparent rounded-full mx-auto"></div>
                        <p className="text-sm text-muted-foreground mt-2">Finding optimal times...</p>
                      </div>
                    )}
                    
                    {!isLoadingAiSuggestions && suggestedTimeSlots.length > 0 && (
                      <SuggestedTimeSlots 
                        slots={suggestedTimeSlots} 
                        timezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
                        onSelectSlot={handleSelectTimeSlot} 
                      />
                    )}
                    
                    {!isLoadingAiSuggestions && suggestedTimeSlots.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No suggested time slots available. Please select a lead and meeting type first.
                      </div>
                    )}
                  </div>
                )}
                
                {/* Agenda Items */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Agenda Items</h4>
                  <div className="space-y-2">
                    {form.watch('agenda_items').map((item, index) => (
                      <div key={index} className="flex items-center">
                        <Input 
                          value={item}
                          onChange={(e) => {
                            const newItems = [...form.getValues('agenda_items')];
                            newItems[index] = e.target.value;
                            form.setValue('agenda_items', newItems);
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newItems = form.getValues('agenda_items').filter((_, i) => i !== index);
                            form.setValue('agenda_items', newItems);
                          }}
                          className="ml-2"
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentItems = form.getValues('agenda_items') || [];
                        form.setValue('agenda_items', [...currentItems, '']);
                      }}
                      className="w-full mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Agenda Item
                    </Button>
                  </div>
                  
                  {/* AI Suggested Agenda */}
                  {useAiSuggestions && isLoadingAiSuggestions && (
                    <div className="mt-2 p-2 border rounded-md">
                      <div className="flex items-center">
                        <Sparkles className="h-4 w-4 mr-1 text-blue-500" />
                        <span className="text-sm font-medium">Loading AI suggestions...</span>
                      </div>
                      <div className="mt-2 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  )}
                  
                  {useAiSuggestions && !isLoadingAiSuggestions && suggestedAgendaItems.length > 0 && (
                    <div className="mt-2 p-2 border rounded-md">
                      <div className="flex items-center">
                        <Sparkles className="h-4 w-4 mr-1 text-blue-500" />
                        <span className="text-sm font-medium">AI Suggested Agenda</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {suggestedAgendaItems.map((item, index) => (
                          <div key={index} className="text-sm flex items-start">
                            <span className="mr-2">•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="mr-2">Scheduling...</span>
                    <Skeleton className="h-4 w-4 rounded-full animate-spin" />
                  </>
                ) : (
                  'Schedule Meeting'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
} 