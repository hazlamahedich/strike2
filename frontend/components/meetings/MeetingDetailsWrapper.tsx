import { useState, useEffect } from 'react';
import { EnhancedMeetingDetails } from './EnhancedMeetingDetails';
import { Meeting, MeetingSummaryType } from '@/lib/types/meeting';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { getMeetingSummary } from '../../lib/api/meetings';

interface MeetingDetailsWrapperProps {
  meeting: Meeting;
  onUpdate?: (updatedMeeting: Meeting) => void;
  onClose?: () => void;
}

export function MeetingDetailsWrapper({ 
  meeting, 
  onUpdate, 
  onClose 
}: MeetingDetailsWrapperProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedMeeting, setProcessedMeeting] = useState<Meeting | null>(null);
  
  // Ensure the meeting object has all required properties for EnhancedMeetingDetails
  useEffect(() => {
    console.log('MeetingDetailsWrapper received meeting:', meeting);
    
    try {
      // Validate meeting object
      if (!meeting) {
        throw new Error('Meeting object is null or undefined');
      }
      
      // Check for required properties
      const requiredProps = ['id', 'title', 'start_time', 'end_time', 'meeting_type', 'status'];
      const missingProps = requiredProps.filter(prop => !meeting[prop]);
      
      if (missingProps.length > 0) {
        throw new Error(`Meeting object is missing required properties: ${missingProps.join(', ')}`);
      }
      
      // Create a processed meeting object with all required properties
      const processed = { ...meeting };
      
      // Ensure agenda_items is initialized
      if (!processed.agenda_items) {
        processed.agenda_items = [];
      }
      
      // Ensure comprehensive_summary is properly initialized if it exists
      if (processed.comprehensive_summary) {
        console.log('Meeting has comprehensive summary:', processed.comprehensive_summary);
      } else {
        console.log('Meeting does not have a comprehensive summary');
        // Initialize with null to avoid undefined errors
        processed.comprehensive_summary = null;
      }
      
      // Ensure summary and action_items are initialized
      if (!processed.summary) {
        processed.summary = null;
      }
      
      if (!processed.action_items) {
        processed.action_items = [];
      }
      
      // Set the processed meeting
      setProcessedMeeting(processed);
      
      // Show success toast for debugging
      toast({
        title: 'Meeting Details Loaded',
        description: `Successfully loaded meeting: ${processed.title}`,
      });
      
      setIsReady(true);
    } catch (err: any) {
      console.error('Error in MeetingDetailsWrapper:', err);
      setError(err.message);
      
      // Show error toast for debugging
      toast({
        title: 'Error Loading Meeting Details',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [meeting]);
  
  // Inside the component, add a useEffect to load the meeting summary if available
  useEffect(() => {
    const loadMeetingSummary = async () => {
      if (meeting?.id) {
        try {
          // Try to load a comprehensive summary if it exists
          const { data, error } = await getMeetingSummary(
            String(meeting.id), 
            MeetingSummaryType.COMPREHENSIVE
          );
          
          if (data && !error) {
            console.log('Found comprehensive summary:', data);
            // Update the meeting with the summary data
            setProcessedMeeting(prevMeeting => {
              if (!prevMeeting) return prevMeeting;
              return {
                ...prevMeeting,
                comprehensive_summary: {
                  summary: data.summary,
                  insights: data.insights,
                  action_items: data.action_items,
                  next_steps: data.next_steps
                }
              };
            });
          }
        } catch (error) {
          // Just log the error, don't show a toast as this is not critical
          console.log('No comprehensive summary found:', error);
        }
      }
    };
    
    loadMeetingSummary();
  }, [meeting?.id]);
  
  // Handle meeting updates
  const handleMeetingUpdate = (updatedMeeting: Meeting) => {
    console.log('MeetingDetailsWrapper handling update:', updatedMeeting);
    
    // Deep clone the updated meeting to avoid reference issues
    const clonedMeeting = JSON.parse(JSON.stringify(updatedMeeting));
    
    // Update the processed meeting
    setProcessedMeeting(clonedMeeting);
    
    // Call the parent onUpdate if provided
    if (onUpdate) {
      onUpdate(clonedMeeting);
    }
  };
  
  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Meeting Details</h3>
        <p className="text-red-600">{error}</p>
        <Button 
          className="mt-4" 
          variant="outline" 
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    );
  }
  
  if (!isReady || !processedMeeting) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Loading meeting details...</p>
      </div>
    );
  }
  
  return (
    <div className="meeting-details-wrapper">
      <EnhancedMeetingDetails 
        meeting={processedMeeting} 
        onUpdate={handleMeetingUpdate}
        onClose={onClose}
      />
    </div>
  );
} 