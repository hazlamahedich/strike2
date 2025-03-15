'use client';

import { useCallback } from 'react';
import { Clock, MapPin, User, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImprovedDialogRoot, ImprovedDialogContent, ImprovedDialogHeader, ImprovedDialogTitle, ImprovedDialogFooter } from '@/components/ui/improved-dialog';
import { useImprovedDialog } from '@/lib/contexts/ImprovedDialogContext';

// Simplified meeting type for demo
interface SimpleMeeting {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  lead: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

type SimpleMeetingDetailsProps = {
  meeting: SimpleMeeting;
  onClose?: () => void;
  dialogId: string;
};

export function SimpleMeetingDetails({ 
  meeting, 
  onClose,
  dialogId
}: SimpleMeetingDetailsProps) {
  const { openDialog, closeDialog } = useImprovedDialog();
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  // Handler for opening child dialogs
  const handleOpenPhone = useCallback(() => {
    const childDialogId = `${dialogId}-phone`;
    
    openDialog(
      childDialogId,
      <ImprovedDialogContent dialogId={childDialogId} className="max-w-md">
        <ImprovedDialogHeader>
          <ImprovedDialogTitle>Call {meeting.lead.first_name} {meeting.lead.last_name}</ImprovedDialogTitle>
        </ImprovedDialogHeader>
        <div className="py-6">
          <p className="text-center text-lg font-medium">{meeting.lead.phone}</p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            You can call this number directly from your device
          </p>
        </div>
        <ImprovedDialogFooter>
          <Button variant="outline" onClick={() => closeDialog(childDialogId)}>Cancel</Button>
          <Button>Call Now</Button>
        </ImprovedDialogFooter>
      </ImprovedDialogContent>
    );
  }, [dialogId, meeting, openDialog, closeDialog]);

  // Handler for opening email dialog
  const handleOpenEmail = useCallback(() => {
    const childDialogId = `${dialogId}-email`;
    
    openDialog(
      childDialogId,
      <ImprovedDialogContent dialogId={childDialogId} className="max-w-md">
        <ImprovedDialogHeader>
          <ImprovedDialogTitle>Email {meeting.lead.first_name} {meeting.lead.last_name}</ImprovedDialogTitle>
        </ImprovedDialogHeader>
        <div className="py-6">
          <p className="text-center text-lg font-medium">{meeting.lead.email}</p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            You can send an email to this address
          </p>
        </div>
        <ImprovedDialogFooter>
          <Button variant="outline" onClick={() => closeDialog(childDialogId)}>Cancel</Button>
          <Button>Open Email Client</Button>
        </ImprovedDialogFooter>
      </ImprovedDialogContent>
    );
  }, [dialogId, meeting, openDialog, closeDialog]);

  // Handler for opening reschedule dialog
  const handleOpenReschedule = useCallback(() => {
    const childDialogId = `${dialogId}-reschedule`;
    
    openDialog(
      childDialogId,
      <ImprovedDialogContent dialogId={childDialogId} className="max-w-md">
        <ImprovedDialogHeader>
          <ImprovedDialogTitle>Reschedule Meeting</ImprovedDialogTitle>
        </ImprovedDialogHeader>
        <div className="py-6">
          <p className="text-center text-sm text-muted-foreground">
            This is where rescheduling options would appear
          </p>
        </div>
        <ImprovedDialogFooter>
          <Button variant="outline" onClick={() => closeDialog(childDialogId)}>Cancel</Button>
          <Button>Confirm New Time</Button>
        </ImprovedDialogFooter>
      </ImprovedDialogContent>
    );
  }, [dialogId, openDialog, closeDialog]);
  
  const statusColor = {
    'scheduled': 'bg-blue-50 text-blue-700',
    'completed': 'bg-green-50 text-green-700',
    'cancelled': 'bg-red-50 text-red-700'
  }[meeting.status] || 'bg-gray-50 text-gray-700';
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold">{meeting.title}</CardTitle>
          <Badge className={statusColor}>
            {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Date & Time */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {formatDate(meeting.start_time)} - {formatDate(meeting.end_time)}
            </span>
          </div>
          
          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{meeting.location}</span>
          </div>
          
          {/* Lead */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{meeting.lead.first_name} {meeting.lead.last_name}</span>
          </div>
          
          {/* Description */}
          <div className="pt-2">
            <h3 className="text-sm font-medium mb-1">Description</h3>
            <p className="text-sm text-muted-foreground">{meeting.description}</p>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 mt-4 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={handleOpenEmail}>
              Email
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenPhone}>
              Call
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenReschedule}>
              Reschedule
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 