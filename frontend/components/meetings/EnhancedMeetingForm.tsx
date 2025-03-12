import { useState, useEffect, useRef, useCallback } from 'react';
import { format, parseISO, addMinutes } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Calendar, Search, User, Plus, Sparkles, Phone, Mail } from 'lucide-react';
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
import { Meeting, MeetingType, MeetingStatus } from '@/lib/types/meeting';
import { createMeeting } from '@/lib/api/meetings';

// Define TimeSlot interface if not already imported
interface TimeSlot {
  start_time: string;
  end_time: string;
}

// Define interfaces for AI suggestion API responses
interface DurationResponse {
  duration_minutes: number;
}

interface AgendaResponse {
  agenda_items: string[];
}

interface AvailabilityResponse {
  available_slots: TimeSlot[];
}

interface AvailabilityRequest {
  lead_id: string;
  meeting_type: string;
  preferred_days?: string[];
  preferred_times?: string[];
}

// Mock API functions
const getRecommendedDuration = async (meetingType: string, leadId: string): Promise<{data: DurationResponse | null, error: Error | null}> => {
  return { data: null, error: null };
};

const generateMeetingAgenda = async (meetingType: string, leadId: string): Promise<{data: AgendaResponse | null, error: Error | null}> => {
  return { data: null, error: null };
};

const getSuggestedMeetingTimes = async (request: AvailabilityRequest): Promise<{data: AvailabilityResponse | null, error: Error | null}> => {
  return { data: null, error: null };
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
  location: z.string().optional(),
  location_type: z.string().default('virtual'),
  use_ai_suggestions: z.boolean().default(false),
  agenda_items: z.array(z.string()).default([]),
});

export interface EnhancedMeetingFormProps {
  leadOptions?: Lead[];
  initialTimeSlot?: TimeSlot | null;
  onSuccess?: (meeting: Meeting) => void;
  onCancel?: () => void;
  onCallContact?: (lead: Lead) => void;
  onSendEmail?: (lead: Lead) => void;
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

export function EnhancedMeetingForm({
  leadOptions = [],
  initialTimeSlot = null,
  onSuccess,
  onCancel,
  onCallContact,
  onSendEmail
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
  
  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lead_id: selectedLead?.id?.toString() || '',
      lead_email: selectedLead?.email || '',
      lead_phone: selectedLead?.phone || '',
      title: '',
      description: '',
      date: initialTimeSlot ? format(parseISO(initialTimeSlot.start_time), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      start_time: initialTimeSlot ? format(parseISO(initialTimeSlot.start_time), 'HH:mm') : '09:00',
      end_time: initialTimeSlot ? format(parseISO(initialTimeSlot.end_time), 'HH:mm') : '10:00',
      meeting_type: MeetingType.INITIAL_CALL,
      location: '',
      location_type: 'virtual',
      use_ai_suggestions: false,
      agenda_items: [],
    },
  });
  
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
    if (!useAiSuggestions) return;
    
    setIsLoadingAiSuggestions(true);
    try {
      // Use mock data instead of API call
      setTimeout(() => {
        setSuggestedTimeSlots(MOCK_SUGGESTED_TIMESLOTS);
        setIsLoadingAiSuggestions(false);
      }, 2000); // Simulate API delay
    } catch (error) {
      console.error('Error loading suggested time slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI suggestions for scheduling',
        variant: 'destructive',
      });
      setIsLoadingAiSuggestions(false);
    }
  }, [useAiSuggestions]);

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
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedLead) return;
    
    setIsLoading(true);
    try {
      const date = values.date;
      const startTime = new Date(`${date}T${values.start_time}`);
      const endTime = new Date(`${date}T${values.end_time}`);
      
      const meetingData = {
        lead_id: values.lead_id,
        lead_email: values.lead_email,
        lead_phone: values.lead_phone,
        title: values.title,
        description: values.description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        meeting_type: values.meeting_type,
        location: values.location,
        status: MeetingStatus.SCHEDULED,
        agenda_items: values.agenda_items || [],
      };
      
      const { data, error } = await createMeeting(meetingData);
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: 'Success',
        description: 'Meeting scheduled successfully',
      });
      
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule meeting',
        variant: 'destructive',
      });
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
                        onFocus={() => setShowDropdown(true)}
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
                                className="px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between text-gray-900 dark:text-gray-100"
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lead_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                
                {/* AI Suggested Time Slots */}
                {useAiSuggestions && suggestedTimeSlots.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <Sparkles className="h-4 w-4 mr-1 text-blue-500" />
                      AI Suggested Time Slots
                    </h4>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                      {suggestedTimeSlots.map((slot, index) => (
                        <div 
                          key={index}
                          className="p-2 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                          onClick={() => handleSelectTimeSlot(slot)}
                        >
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm">
                              {format(parseISO(slot.start_time), 'MMM d, yyyy')} at {format(parseISO(slot.start_time), 'h:mm a')}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {format(parseISO(slot.start_time), 'h:mm a')} - {format(parseISO(slot.end_time), 'h:mm a')}
                          </Badge>
                        </div>
                      ))}
                    </div>
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