'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { MeetingCreate, MeetingType, MeetingLocationType } from '@/lib/types/meeting';
import { Lead } from '@/lib/types/lead';
import { createMeeting } from '@/lib/api/meetings';
import { toast } from '@/components/ui/use-toast';

// Create arrays of options for the dropdowns
const MEETING_TYPE_OPTIONS = [
  { value: 'initial_call', label: 'Initial Call' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'demo', label: 'Demo' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'other', label: 'Other' },
];

const LOCATION_TYPE_OPTIONS = [
  { value: 'virtual', label: 'Virtual' },
  { value: 'in_person', label: 'In Person' },
  { value: 'phone', label: 'Phone' },
];

const formSchema = z.object({
  lead_id: z.number({
    required_error: "Lead is required",
  }),
  lead_email: z.string().email({
    message: "Please enter a valid email address",
  }),
  title: z.string().min(2, {
    message: "Title must be at least 2 characters",
  }),
  description: z.string().optional(),
  date: z.string({
    required_error: "Meeting date is required",
  }),
  start_time: z.string({
    required_error: "Start time is required",
  }),
  end_time: z.string({
    required_error: "End time is required",
  }),
  meeting_type: z.string({
    required_error: "Meeting type is required",
  }),
  location: z.string().optional(),
  location_type: z.string().optional(),
});

type MeetingFormProps = {
  lead?: Lead;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function MeetingForm({ lead, onSuccess, onCancel }: MeetingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocationType, setSelectedLocationType] = useState('virtual');

  // Get today's date in YYYY-MM-DD format for the date input
  const today = new Date();
  const formattedToday = format(today, 'yyyy-MM-dd');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lead_id: lead?.id,
      lead_email: lead?.email || '',
      title: '',
      description: '',
      meeting_type: 'initial_call',
      location: 'Zoom: ',
      start_time: '09:00',
      end_time: '10:00',
      date: formattedToday,
      location_type: 'virtual',
    },
  });

  useEffect(() => {
    if (lead) {
      form.setValue('lead_id', lead.id);
      form.setValue('lead_email', lead.email || '');
    }
    
    // Debug form values
    console.log('Form values:', form.getValues());
  }, [lead, form]);

  const handleLocationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLocationType(value);
    
    // Set a default location prefix based on the type
    let locationPrefix = '';
    if (value === 'virtual') {
      locationPrefix = 'Zoom: ';
    } else if (value === 'phone') {
      locationPrefix = 'Phone: ';
    }
    
    form.setValue('location', locationPrefix);
    form.setValue('location_type', value);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      console.log('Form submitted with values:', values);
      
      // Format date and times for API
      const date = new Date(values.date);
      const startTime = values.start_time;
      const endTime = values.end_time;
      
      // Create ISO strings for start and end times
      const startDateTime = new Date(`${values.date}T${startTime}`);
      const endDateTime = new Date(`${values.date}T${endTime}`);
      
      // Convert string meeting type to enum
      const meetingTypeEnum = values.meeting_type as MeetingType;
      
      const meetingData: MeetingCreate = {
        lead_id: values.lead_id,
        lead_email: values.lead_email,
        title: values.title,
        description: values.description || '',
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        meeting_type: meetingTypeEnum,
        location: values.location || '',
      };
      
      try {
        const meeting = await createMeeting(meetingData);
        
        toast({
          title: "Meeting scheduled",
          description: "The meeting has been scheduled successfully.",
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to schedule meeting. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Meeting Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting Title</FormLabel>
                <FormControl>
                  <Input placeholder="Initial Discovery Call" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Meeting Type */}
          <FormField
            control={form.control}
            name="meeting_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting Type</FormLabel>
                <FormControl>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  >
                    {MEETING_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Meeting agenda and details" 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Date Picker */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    min={formattedToday}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Start Time */}
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
          
          {/* End Time */}
          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <div className="flex space-x-2">
                  <div className="w-1/3">
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedLocationType}
                      onChange={handleLocationTypeChange}
                    >
                      {LOCATION_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-2/3">
                    <FormControl>
                      <Input placeholder="Zoom link or physical address" {...field} />
                    </FormControl>
                  </div>
                </div>
                <FormDescription>
                  Enter a virtual meeting link or physical address
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        
        {/* Submit and Cancel Buttons */}
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                console.log('Cancel button clicked');
                if (onCancel) onCancel();
              }}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 