'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Meeting, MeetingStatus } from '@/lib/types/meeting';

// Extend the Meeting type to include agenda_items
interface EnhancedMeeting extends Meeting {
  agenda_items?: string[];
}

// Define context shape
interface EnhancedMeetingDetailsContextType {
  isOpen: boolean;
  selectedMeeting: EnhancedMeeting | null;
  showMeetingDetails: (meeting: EnhancedMeeting) => void;
  closeMeetingDetails: () => void;
  updateMeeting: (updatedMeeting: EnhancedMeeting) => void;
}

// Create context with default values
const EnhancedMeetingDetailsContext = createContext<EnhancedMeetingDetailsContextType>({
  isOpen: false,
  selectedMeeting: null,
  showMeetingDetails: () => {},
  closeMeetingDetails: () => {},
  updateMeeting: () => {},
});

// Hook to use meeting details context
export const useEnhancedMeetingDetails = () => useContext(EnhancedMeetingDetailsContext);

// Provider component
interface EnhancedMeetingDetailsProviderProps {
  children: ReactNode;
  onMeetingUpdated?: (meeting: EnhancedMeeting) => void;
  refreshMeetings?: () => void;
}

export const EnhancedMeetingDetailsProvider = ({ 
  children,
  onMeetingUpdated,
  refreshMeetings
}: EnhancedMeetingDetailsProviderProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedMeeting, setSelectedMeeting] = useState<EnhancedMeeting | null>(null);

  // Show meeting details
  const showMeetingDetails = useCallback((meeting: EnhancedMeeting) => {
    setSelectedMeeting(meeting);
    setIsOpen(true);
  }, []);

  // Close meeting details
  const closeMeetingDetails = useCallback(() => {
    setIsOpen(false);
    // We can optionally wait to clear the selected meeting to allow for exit animations
    setTimeout(() => {
      setSelectedMeeting(null);
    }, 300);
  }, []);

  // Update meeting
  const updateMeeting = useCallback((updatedMeeting: EnhancedMeeting) => {
    setSelectedMeeting(updatedMeeting);
    
    // Call external handlers if provided
    if (onMeetingUpdated) {
      onMeetingUpdated(updatedMeeting);
    }
    
    if (refreshMeetings) {
      refreshMeetings();
    }
  }, [onMeetingUpdated, refreshMeetings]);

  // Provide context value
  const value = {
    isOpen,
    selectedMeeting,
    showMeetingDetails,
    closeMeetingDetails,
    updateMeeting
  };

  return (
    <EnhancedMeetingDetailsContext.Provider value={value}>
      {children}
    </EnhancedMeetingDetailsContext.Provider>
  );
};

// Container component to render the details dialog
interface EnhancedMeetingDetailsContainerProps {
  onClose?: () => void;
}

export const EnhancedMeetingDetailsContainer = ({ 
  onClose 
}: EnhancedMeetingDetailsContainerProps) => {
  const { isOpen, selectedMeeting, closeMeetingDetails, updateMeeting } = useEnhancedMeetingDetails();
  
  // If not open or no meeting selected, don't render anything
  if (!isOpen || !selectedMeeting) {
    return null;
  }
  
  const handleClose = () => {
    closeMeetingDetails();
    if (onClose) {
      onClose();
    }
  };
  
  const handleUpdate = (updatedMeeting: EnhancedMeeting) => {
    updateMeeting(updatedMeeting);
  };
  
  // Import the actual component dynamically to avoid circular dependencies
  // This will render the EnhancedMeetingDetails component with the selected meeting
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {React.createElement(
            // @ts-ignore - We'll import this component dynamically
            require('@/components/meetings/EnhancedMeetingDetails').EnhancedMeetingDetails,
            {
              meeting: selectedMeeting,
              onUpdate: handleUpdate,
              onClose: handleClose
            }
          )}
        </div>
      </div>
    </div>
  );
}; 