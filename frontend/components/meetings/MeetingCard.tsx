import { format, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, User, Video } from 'lucide-react';
import { Meeting, MeetingLocationType, MeetingStatus } from '@/lib/types/meeting';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type MeetingCardProps = {
  meeting: Meeting;
  onEdit?: (meeting: Meeting) => void;
  onDelete?: (meeting: Meeting) => void;
  onJoin?: (meeting: Meeting) => void;
};

export function MeetingCard({ meeting, onEdit, onDelete, onJoin }: MeetingCardProps) {
  const startTime = parseISO(meeting.start_time);
  const endTime = parseISO(meeting.end_time);
  
  const isVirtual = meeting.location?.includes('http') || 
                    meeting.location?.includes('zoom') || 
                    meeting.location?.includes('meet') || 
                    meeting.location?.includes('teams');
  
  const getStatusColor = (status: MeetingStatus) => {
    switch (status) {
      case MeetingStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800';
      case MeetingStatus.CONFIRMED:
        return 'bg-green-100 text-green-800';
      case MeetingStatus.CANCELED:
        return 'bg-red-100 text-red-800';
      case MeetingStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800';
      case MeetingStatus.RESCHEDULED:
        return 'bg-yellow-100 text-yellow-800';
      case MeetingStatus.NO_SHOW:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const canJoin = isVirtual && 
                 (meeting.status === MeetingStatus.SCHEDULED || 
                  meeting.status === MeetingStatus.CONFIRMED) &&
                 new Date() >= new Date(startTime.getTime() - 5 * 60000) && // 5 minutes before
                 new Date() <= endTime;
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{meeting.title}</CardTitle>
          <Badge className={cn("ml-2", getStatusColor(meeting.status))}>
            {meeting.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <Calendar className="mr-2 h-4 w-4 opacity-70" />
            <span>{format(startTime, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Clock className="mr-2 h-4 w-4 opacity-70" />
            <span>
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
              {meeting.timezone && ` (${meeting.timezone})`}
            </span>
          </div>
          
          {meeting.location && (
            <div className="flex items-center text-sm">
              {isVirtual ? (
                <Video className="mr-2 h-4 w-4 opacity-70" />
              ) : (
                <MapPin className="mr-2 h-4 w-4 opacity-70" />
              )}
              <span className="truncate">
                {isVirtual ? 'Virtual Meeting' : meeting.location}
              </span>
            </div>
          )}
          
          {meeting.lead && (
            <div className="flex items-center text-sm">
              <User className="mr-2 h-4 w-4 opacity-70" />
              <span>
                {meeting.lead.first_name} {meeting.lead.last_name}
                {meeting.lead.company && ` (${meeting.lead.company})`}
              </span>
            </div>
          )}
          
          {meeting.description && (
            <div className="mt-2 text-sm text-gray-600">
              {meeting.description.length > 100 
                ? `${meeting.description.substring(0, 100)}...` 
                : meeting.description}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 pt-2">
        {onDelete && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDelete(meeting)}
            className="text-red-600 hover:text-red-700"
          >
            Cancel
          </Button>
        )}
        
        {onEdit && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(meeting)}
          >
            Edit
          </Button>
        )}
        
        {canJoin && onJoin && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => onJoin(meeting)}
            className="bg-green-600 hover:bg-green-700"
          >
            Join
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 