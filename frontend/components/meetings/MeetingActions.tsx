import { useState } from 'react';
import { Meeting, MeetingStatus } from '@/lib/types/meeting';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Calendar, Clock, Edit, ExternalLink, MoreHorizontal, Trash, X, RefreshCw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EnhancedMeetingForm } from './EnhancedMeetingForm';
import { format, parseISO, isBefore } from 'date-fns';

interface MeetingActionsProps {
  meeting: Meeting;
  onUpdate?: (updatedMeeting: Meeting) => void;
  onCancel?: (canceledMeeting: Meeting) => void;
  onJoin?: (meeting: Meeting) => void;
  displayMode?: 'compact' | 'full'; // Add display mode option
}

export function MeetingActions({ 
  meeting, 
  onUpdate, 
  onCancel, 
  onJoin,
  displayMode = 'compact' 
}: MeetingActionsProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isPast = isBefore(parseISO(meeting.end_time), new Date());
  const isCanceled = meeting.status === MeetingStatus.CANCELED;
  const isCompleted = meeting.status === MeetingStatus.COMPLETED;
  
  const handleJoinMeeting = () => {
    if (onJoin) {
      onJoin(meeting);
    }
  };
  
  const handleEditMeeting = () => {
    setShowEditDialog(true);
  };
  
  const handleCancelMeeting = async () => {
    try {
      setIsProcessing(true);
      
      // Create a copy of the meeting with updated status
      const canceledMeeting: Meeting = {
        ...meeting,
        status: MeetingStatus.CANCELED,
        updated_at: new Date().toISOString()
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onCancel) {
        onCancel(canceledMeeting);
      }
      
      toast({
        title: "Meeting canceled",
        description: "The meeting has been successfully canceled.",
      });
      
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Failed to cancel meeting:', error);
      toast({
        title: "Failed to cancel meeting",
        description: "There was an error canceling the meeting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRescheduleMeeting = () => {
    // For rescheduling, we'll just open the edit dialog
    // The form will handle updating the meeting status
    setShowEditDialog(true);
  };
  
  const handleEditSuccess = () => {
    if (onUpdate && meeting) {
      // Since we don't have direct access to the updated meeting from the form,
      // we'll just pass the current meeting back to the parent component
      // In a real implementation, the form would return the updated meeting
      onUpdate({
        ...meeting,
        updated_at: new Date().toISOString()
      });
    }
    setShowEditDialog(false);
  };
  
  // Compact mode (dropdown menu)
  if (displayMode === 'compact') {
    return (
      <>
        <div className="flex items-center space-x-2">
          {!isPast && !isCanceled && !isCompleted && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleJoinMeeting}
              className="flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Join
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isPast && !isCanceled && !isCompleted && (
                <>
                  <DropdownMenuItem onClick={handleEditMeeting}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Meeting
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowCancelDialog(true)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Meeting
                  </DropdownMenuItem>
                </>
              )}
              {isPast && !isCompleted && !isCanceled && (
                <DropdownMenuItem onClick={handleEditMeeting}>
                  <Clock className="h-4 w-4 mr-2" />
                  Mark as Completed
                </DropdownMenuItem>
              )}
              {isCanceled && (
                <DropdownMenuItem onClick={handleRescheduleMeeting}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Reschedule
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Cancel Meeting Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Meeting</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this meeting? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="font-medium">{meeting.title}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {format(parseISO(meeting.start_time), 'EEEE, MMMM d, yyyy')} at {format(parseISO(meeting.start_time), 'h:mm a')}
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowCancelDialog(false)}
                disabled={isProcessing}
              >
                Keep Meeting
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancelMeeting}
                disabled={isProcessing}
              >
                {isProcessing ? "Canceling..." : "Cancel Meeting"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Meeting Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {isCanceled ? "Reschedule Meeting" : "Edit Meeting"}
              </DialogTitle>
            </DialogHeader>
            
            <EnhancedMeetingForm 
              existingMeeting={meeting}
              onSuccess={handleEditSuccess}
              onCancel={() => setShowEditDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }
  
  // Full mode (buttons displayed directly)
  return (
    <>
      <div className="flex flex-wrap gap-2 mt-4">
        {!isPast && !isCanceled && !isCompleted && (
          <>
            <Button 
              variant="outline" 
              onClick={handleJoinMeeting}
              className="flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Join Meeting
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleEditMeeting}
              className="flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Meeting
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={() => setShowCancelDialog(true)}
              className="flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Meeting
            </Button>
          </>
        )}
        
        {isPast && !isCompleted && !isCanceled && (
          <Button 
            variant="outline" 
            onClick={handleEditMeeting}
            className="flex items-center"
          >
            <Clock className="h-4 w-4 mr-2" />
            Mark as Completed
          </Button>
        )}
        
        {isCanceled && (
          <Button 
            variant="outline" 
            onClick={handleRescheduleMeeting}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reschedule Meeting
          </Button>
        )}
      </div>
      
      {/* Cancel Meeting Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Meeting</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this meeting? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="font-medium">{meeting.title}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {format(parseISO(meeting.start_time), 'EEEE, MMMM d, yyyy')} at {format(parseISO(meeting.start_time), 'h:mm a')}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
              disabled={isProcessing}
            >
              Keep Meeting
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelMeeting}
              disabled={isProcessing}
            >
              {isProcessing ? "Canceling..." : "Cancel Meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Meeting Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {isCanceled ? "Reschedule Meeting" : "Edit Meeting"}
            </DialogTitle>
          </DialogHeader>
          
          <EnhancedMeetingForm 
            existingMeeting={meeting}
            onSuccess={handleEditSuccess}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 