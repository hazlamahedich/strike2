import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Meeting, MeetingStatus, MeetingType } from '@/lib/types/meeting';
import { format, parseISO, isBefore, isAfter, addHours, isSameDay, isWithinInterval } from 'date-fns';
import { MOCK_MEETINGS } from '@/lib/mock/meetings';

type EnhancedMeetingFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
  existingMeeting?: Meeting;
};

export function EnhancedMeetingForm({ onSuccess, onCancel, existingMeeting }: EnhancedMeetingFormProps) {
  const [title, setTitle] = useState(existingMeeting?.title || '');
  const [description, setDescription] = useState(existingMeeting?.description || '');
  const [date, setDate] = useState(existingMeeting ? format(parseISO(existingMeeting.start_time), 'yyyy-MM-dd') : '');
  const [startTime, setStartTime] = useState(existingMeeting ? format(parseISO(existingMeeting.start_time), 'HH:mm') : '09:00');
  const [endTime, setEndTime] = useState(existingMeeting ? format(parseISO(existingMeeting.end_time), 'HH:mm') : '10:00');
  const [meetingType, setMeetingType] = useState<string>(existingMeeting?.meeting_type || MeetingType.INITIAL_CALL);
  const [location, setLocation] = useState(existingMeeting?.location || '');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadId, setLeadId] = useState(existingMeeting?.lead_id || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflicts, setConflicts] = useState<Meeting[]>([]);
  const [allMeetings, setAllMeetings] = useState<Meeting[]>(MOCK_MEETINGS);

  // Check for conflicts whenever date or time changes
  useEffect(() => {
    checkForConflicts();
  }, [date, startTime, endTime]);

  const checkForConflicts = () => {
    if (!date || !startTime || !endTime) {
      setConflicts([]);
      return;
    }

    try {
      // Create Date objects for the proposed meeting time
      const proposedStart = new Date(`${date}T${startTime}`);
      const proposedEnd = new Date(`${date}T${endTime}`);

      // Validate that end time is after start time
      if (isBefore(proposedEnd, proposedStart)) {
        toast({
          title: "Invalid Time Range",
          description: "End time must be after start time",
          variant: "destructive",
        });
        return;
      }

      // Find conflicts with existing meetings
      const conflictingMeetings = allMeetings.filter(meeting => {
        // Skip the current meeting if we're editing
        if (existingMeeting && meeting.id === existingMeeting.id) {
          return false;
        }

        const meetingStart = parseISO(meeting.start_time);
        const meetingEnd = parseISO(meeting.end_time);

        // Check if the meeting is on the same day
        if (!isSameDay(meetingStart, proposedStart)) {
          return false;
        }

        // Check for time overlap
        return (
          // Proposed start time is during an existing meeting
          (isWithinInterval(proposedStart, { start: meetingStart, end: meetingEnd }) ||
          // Proposed end time is during an existing meeting
          isWithinInterval(proposedEnd, { start: meetingStart, end: meetingEnd }) ||
          // Existing meeting is completely within the proposed time
          (isBefore(proposedStart, meetingStart) && isAfter(proposedEnd, meetingEnd)))
        );
      });

      setConflicts(conflictingMeetings);
    } catch (error) {
      console.error('Error checking for conflicts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !date || !startTime || !endTime || !meetingType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check for conflicts before submitting
    if (conflicts.length > 0) {
      toast({
        title: "Scheduling Conflict",
        description: "There are conflicts with existing meetings. Please choose a different time.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create start and end time Date objects
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);
      
      // Prepare meeting data
      const meetingData = {
        id: existingMeeting?.id || Math.floor(Math.random() * 1000) + 100, // Generate a random ID for mock data
        title,
        description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        meeting_type: meetingType as MeetingType,
        status: existingMeeting?.status || MeetingStatus.SCHEDULED,
        location,
        lead_id: leadId,
        user_id: 1, // Current user ID (mock)
        created_at: existingMeeting?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Meeting scheduled with:', meetingData);
      
      // Update the local meetings list
      if (existingMeeting) {
        // Update existing meeting
        setAllMeetings(prevMeetings => 
          prevMeetings.map(m => m.id === existingMeeting.id ? meetingData as Meeting : m)
        );
      } else {
        // Add new meeting
        setAllMeetings(prevMeetings => [...prevMeetings, meetingData as Meeting]);
      }
      
      toast({
        title: existingMeeting ? "Meeting updated" : "Meeting scheduled",
        description: existingMeeting 
          ? "The meeting has been successfully updated." 
          : "The meeting has been successfully scheduled.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
      toast({
        title: existingMeeting ? "Failed to update meeting" : "Failed to schedule meeting",
        description: "There was an error. Please try again.",
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
          <Label htmlFor="title">Meeting Title *</Label>
          <Input
            id="title"
            placeholder="Initial Discovery Call"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Discuss project requirements and timeline"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="meetingType">Meeting Type *</Label>
            <Select 
              value={meetingType} 
              onValueChange={setMeetingType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select meeting type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MeetingType.INITIAL_CALL}>Initial Call</SelectItem>
                <SelectItem value={MeetingType.DISCOVERY}>Discovery</SelectItem>
                <SelectItem value={MeetingType.DEMO}>Demo</SelectItem>
                <SelectItem value={MeetingType.PROPOSAL}>Proposal</SelectItem>
                <SelectItem value={MeetingType.NEGOTIATION}>Negotiation</SelectItem>
                <SelectItem value={MeetingType.FOLLOW_UP}>Follow-up</SelectItem>
                <SelectItem value={MeetingType.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time *</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endTime">End Time *</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Zoom Meeting / Office / Phone Call"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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
          />
        </div>
      </div>
      
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-medium">Scheduling Conflicts Detected:</p>
          <ul className="list-disc pl-5 mt-2 text-sm">
            {conflicts.map((meeting, index) => (
              <li key={index}>
                {meeting.title} ({format(parseISO(meeting.start_time), 'h:mm a')} - {format(parseISO(meeting.end_time), 'h:mm a')})
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting || conflicts.length > 0}
        >
          {isSubmitting 
            ? (existingMeeting ? "Updating..." : "Scheduling...") 
            : (existingMeeting ? "Update Meeting" : "Schedule Meeting")
          }
        </Button>
      </div>
    </form>
  );
} 