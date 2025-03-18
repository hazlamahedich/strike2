import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, parseISO, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { Meeting, MeetingType } from '@/lib/types/meeting';
import { Lead } from '@/lib/types/lead';
import { getSuggestedMeetingTimes, TimeSlot, AvailabilityResponse } from '@/lib/services/aiMeetingService';

type EnhancedCalendarViewProps = {
  meetings: Meeting[];
  leads?: Lead[];
  onSelectTimeSlot?: (timeSlot: TimeSlot) => void;
  onSelectMeeting?: (meeting: Meeting) => void;
};

export function EnhancedCalendarView({
  meetings,
  leads,
  onSelectTimeSlot,
  onSelectMeeting,
}: EnhancedCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(currentDate, { weekStartsOn: 1 }));
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [selectedMeetingType, setSelectedMeetingType] = useState<MeetingType | null>(null);
  const [suggestedTimeSlots, setSuggestedTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [processedMeetings, setProcessedMeetings] = useState<Meeting[]>([]);
  
  // Process meetings when they change
  useEffect(() => {
    console.log('EnhancedCalendarView received meetings:', meetings);
    // Deep clone the meetings to avoid reference issues
    const clonedMeetings = JSON.parse(JSON.stringify(meetings));
    setProcessedMeetings(clonedMeetings);
  }, [meetings]);
  
  // Initialize week days
  useEffect(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    setWeekStart(start);
    setWeekDays(
      eachDayOfInterval({
        start,
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      })
    );
  }, [currentDate]);
  
  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };
  
  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };
  
  // Get AI-suggested meeting times
  const getSuggestions = async () => {
    if (!selectedMeetingType) return;
    
    setIsLoadingSuggestions(true);
    try {
      const { data, error } = await getSuggestedMeetingTimes({
        lead_id: selectedLead || undefined,
        meeting_type: selectedMeetingType,
        days_ahead: 7,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setSuggestedTimeSlots(data.available_slots || []);
    } catch (error) {
      console.error('Error getting suggested meeting times:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  
  // Check if a time slot is suggested by AI
  const isSuggestedTimeSlot = (date: Date, hour: number): TimeSlot | undefined => {
    if (!suggestedTimeSlots.length) return undefined;
    
    return suggestedTimeSlots.find(slot => {
      const slotStart = parseISO(slot.start_time);
      return (
        isSameDay(date, slotStart) &&
        slotStart.getHours() === hour
      );
    });
  };
  
  // Get meetings for a specific day and hour
  const getMeetingsForTimeSlot = (date: Date, hour: number): Meeting[] => {
    return processedMeetings.filter(meeting => {
      const meetingStart = parseISO(meeting.start_time);
      return (
        isSameDay(date, meetingStart) &&
        meetingStart.getHours() === hour
      );
    });
  };
  
  // Handle time slot selection
  const handleTimeSlotClick = (date: Date, hour: number) => {
    const meetingsInSlot = getMeetingsForTimeSlot(date, hour);
    
    if (meetingsInSlot.length > 0 && onSelectMeeting) {
      // If there are meetings in this slot, select the first one
      console.log('Selected meeting from calendar:', meetingsInSlot[0]);
      onSelectMeeting(meetingsInSlot[0]);
    } else {
      // If no meetings, check if it's a suggested time slot
      const suggestedSlot = isSuggestedTimeSlot(date, hour);
      
      if (suggestedSlot && onSelectTimeSlot) {
        console.log('Selected suggested time slot:', suggestedSlot);
        onSelectTimeSlot(suggestedSlot);
      } else {
        // If not a suggested slot, create a new time slot
        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(hour + 1, 0, 0, 0);
        
        const newTimeSlot: TimeSlot = {
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          score: undefined
        };
        
        console.log('Created new time slot:', newTimeSlot);
        if (onSelectTimeSlot) {
          onSelectTimeSlot(newTimeSlot);
        }
      }
    }
  };
  
  // Generate time slots for the calendar (8 AM to 6 PM)
  const timeSlots = Array.from({ length: 11 }, (_, i) => i + 8);
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Calendar</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </div>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* AI Suggestion Controls */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex-1 min-w-[200px]">
            <Select
              value={selectedMeetingType ? selectedMeetingType.toString() : ""}
              onValueChange={(value) => setSelectedMeetingType(value as MeetingType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select meeting type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MeetingType).map((type) => (
                  <SelectItem key={type} value={type.toString()}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {leads && leads.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <Select
                value={selectedLead || ""}
                onValueChange={setSelectedLead}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lead (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any lead</SelectItem>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.first_name} {lead.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Button
            variant="outline"
            onClick={getSuggestions}
            disabled={isLoadingSuggestions || !selectedMeetingType}
            className="whitespace-nowrap"
          >
            <Sparkles className="mr-1 h-4 w-4 text-blue-500" />
            {isLoadingSuggestions ? 'Loading...' : 'Get AI Suggestions'}
          </Button>
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-8 gap-1 text-center">
          {/* Time column */}
          <div className="col-span-1">
            <div className="h-10 flex items-center justify-center font-medium">
              <Clock className="h-4 w-4 mr-1" />
            </div>
            {timeSlots.map((hour) => (
              <div key={hour} className="h-14 flex items-center justify-center text-sm text-gray-500">
                {hour % 12 === 0 ? 12 : hour % 12} {hour >= 12 ? 'PM' : 'AM'}
              </div>
            ))}
          </div>
          
          {/* Days columns */}
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="col-span-1">
              <div className="h-10 flex flex-col items-center justify-center">
                <div className="font-medium">{format(day, 'EEE')}</div>
                <div className="text-xs text-gray-500">{format(day, 'MMM d')}</div>
              </div>
              
              {timeSlots.map((hour) => {
                const meetings = getMeetingsForTimeSlot(day, hour);
                const suggestedSlot = isSuggestedTimeSlot(day, hour);
                
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={`h-14 border border-gray-100 p-1 cursor-pointer transition-colors ${
                      meetings.length > 0
                        ? 'bg-blue-50'
                        : suggestedSlot
                        ? 'bg-amber-50 hover:bg-amber-100'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleTimeSlotClick(day, hour)}
                  >
                    {meetings.length > 0 ? (
                      <div className="text-xs">
                        {meetings.map((meeting) => (
                          <div
                            key={meeting.id}
                            className="bg-blue-100 text-blue-800 rounded px-1 py-0.5 mb-0.5 truncate"
                          >
                            {meeting.title}
                          </div>
                        ))}
                      </div>
                    ) : suggestedSlot ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center h-full">
                              <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                                <Sparkles className="h-3 w-3 mr-1" />
                                {suggestedSlot.score ? `Score: ${suggestedSlot.score}` : 'Suggested'}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>AI-suggested optimal meeting time</p>
                            {suggestedSlot.score && (
                              <p className="text-xs text-gray-500">Confidence score: {suggestedSlot.score}/10</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 