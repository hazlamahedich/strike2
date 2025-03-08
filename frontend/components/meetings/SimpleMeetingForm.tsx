import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { createMeeting } from '@/lib/api/meetings';
import { MeetingCreate, MeetingStatus, MeetingType } from '@/lib/types/meeting';
import { USE_MOCK_DATA } from '@/lib/config';
import { ApiResponse } from '@/lib/api/client';

type SimpleMeetingFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function SimpleMeetingForm({ onSuccess, onCancel }: SimpleMeetingFormProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Zoom Meeting');
  const [leadEmail, setLeadEmail] = useState('client@example.com'); // Default lead email
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create meeting date objects
      const startDateTime = new Date(`${date}T${time}`);
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + 1); // Default to 1 hour meeting
      
      // Create meeting object
      const meetingData: MeetingCreate = {
        title,
        description: description || title,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location,
        status: MeetingStatus.SCHEDULED,
        lead_id: 1, // Default lead ID, should be replaced with actual lead selection
        lead_email: leadEmail, // Used for sending invitations
        meeting_type: MeetingType.INITIAL_CALL,
        notes: `Meeting scheduled via SimpleMeetingForm on ${new Date().toISOString()}`
      };
      
      if (USE_MOCK_DATA) {
        // Simulate API call for mock data
        console.log('Creating mock meeting:', meetingData);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Call the real API
        console.log('Creating meeting via API:', meetingData);
        try {
          const response = await createMeeting(meetingData);
          
          if (response.error) {
            throw new Error(response.error.message || 'Failed to create meeting');
          }
          
          console.log('Meeting created successfully:', response.data);
        } catch (apiError) {
          console.error('API error creating meeting:', apiError);
          throw new Error('Failed to create meeting via API');
        }
      }
      
      console.log('Meeting scheduled with:', { title, date, time });
      
      toast({
        title: "Meeting scheduled",
        description: "The meeting has been successfully scheduled.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
      toast({
        title: "Failed to schedule meeting",
        description: "There was an error scheduling the meeting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Meeting Title</Label>
          <Input
            id="title"
            placeholder="Initial Discovery Call"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            placeholder="Brief description of the meeting"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Meeting Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Meeting Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Zoom Meeting, Google Meet, etc."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="leadEmail">Lead Email</Label>
          <Input
            id="leadEmail"
            type="email"
            placeholder="client@example.com"
            value={leadEmail}
            onChange={(e) => setLeadEmail(e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
        </Button>
      </div>
      
      {USE_MOCK_DATA && (
        <div className="text-xs text-muted-foreground mt-2 text-center">
          Using mock data mode. Set USE_MOCK_DATA to false in config.ts to use real API.
        </div>
      )}
    </form>
  );
} 