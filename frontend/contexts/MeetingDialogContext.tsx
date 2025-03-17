'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Meeting } from '@/lib/types/meeting';

// Define meeting dialog types
export enum MeetingDialogType {
  DETAILS = 'details',
  SCHEDULE = 'schedule',
  EDIT = 'edit',
  RESCHEDULE = 'reschedule',
  CANCEL = 'cancel',
  SUMMARY = 'summary',
  COMPREHENSIVE_SUMMARY = 'comprehensive_summary',
  PHONE = 'phone',
  EMAIL = 'email',
  AGENDA = 'agenda'
}

// Define dialog data structure
export interface MeetingDialogData {
  id: string;
  type: MeetingDialogType;
  content: ReactNode;
  data?: Record<string, any>;
  zIndex: number;
  isActive: boolean;
  minimized?: boolean;
  maximized?: boolean;
  // Additional data for position/size management
  previousPosition?: { x: number; y: number };
  previousSize?: { width: number | string; height: number | string };
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

// Define context shape
interface MeetingDialogContextType {
  dialogs: MeetingDialogData[];
  openMeetingDialog: (
    id: string, 
    type: MeetingDialogType, 
    content: React.ReactNode, 
    data?: Record<string, any>
  ) => boolean;
  closeMeetingDialog: (id: string) => boolean;
  focusDialog: (id: string) => void;
  minimizeDialog: (id: string, minimized: boolean) => void;
  maximizeDialog: (id: string, maximized: boolean) => void;
  isDialogOpen: (id: string) => boolean;
  getDialogZIndex: (id: string) => number;
  getDialogData: (id: string) => MeetingDialogData | undefined;
  getAllDialogs: () => MeetingDialogData[];
  setDialogs: React.Dispatch<React.SetStateAction<MeetingDialogData[]>>;
}

// Create context with default values
const MeetingDialogContext = createContext<MeetingDialogContextType>({
  dialogs: [],
  openMeetingDialog: () => false,
  closeMeetingDialog: () => false,
  focusDialog: () => {},
  minimizeDialog: () => {},
  maximizeDialog: () => {},
  isDialogOpen: () => false,
  getDialogZIndex: () => 50,
  getDialogData: () => undefined,
  getAllDialogs: () => [],
  setDialogs: () => {},
});

// Hook to use meeting dialog context
export const useMeetingDialog = () => useContext(MeetingDialogContext);

// Base Z-index for dialogs
const BASE_Z_INDEX = 50;

// Provider component
interface MeetingDialogProviderProps {
  children: ReactNode;
}

export const MeetingDialogProvider = ({ children }: MeetingDialogProviderProps) => {
  const [dialogs, setDialogs] = useState<MeetingDialogData[]>([]);
  const [highestZIndex, setHighestZIndex] = useState(BASE_Z_INDEX);

  // Open a new meeting dialog
  const openMeetingDialog = useCallback((
    id: string, 
    type: MeetingDialogType, 
    content: React.ReactNode, 
    data?: Record<string, any>
  ) => {
    console.log('⭐⭐⭐ CONTEXT: Opening dialog with ID:', id);
    console.log('⭐⭐⭐ CONTEXT: Dialog type:', type);
    console.log('⭐⭐⭐ CONTEXT: Dialog data:', data);
    console.log('⭐⭐⭐ CONTEXT: Dialog content provided:', !!content);
    
    // Check for invalid input
    if (!id) {
      console.error('⭐⭐⭐ CONTEXT ERROR: Cannot open dialog - missing id');
      return false;
    }
    
    if (!content) {
      console.error('⭐⭐⭐ CONTEXT ERROR: Cannot open dialog - missing content');
      return false;
    }
    
    // Debugging: Log current state before update
    console.log('⭐⭐⭐ CONTEXT DEBUG: Current dialogs state:', {
      count: dialogs.length,
      ids: dialogs.map(d => d.id)
    });
    
    setDialogs(prevDialogs => {
      console.log('⭐⭐⭐ CONTEXT: Previous dialogs count:', prevDialogs.length);
      console.log('⭐⭐⭐ CONTEXT: Previous dialogs IDs:', prevDialogs.map(d => d.id));
      
      // Check if dialog already exists
      const existingIndex = prevDialogs.findIndex(d => d.id === id);
      
      // Additional check
      console.log('⭐⭐⭐ CONTEXT: Dialog exists?', existingIndex >= 0 ? 'Yes' : 'No');
      
      // Set all dialogs to inactive
      const inactiveDialogs = prevDialogs.map(d => ({
        ...d,
        isActive: false
      }));
      
      // Calculate position (center of screen with slight offset)
      const position = {
        x: window.innerWidth / 2 - 300 + (prevDialogs.length * 30),
        y: window.innerHeight / 2 - 200 + (prevDialogs.length * 30)
      };
      
      // Create the new dialog
      const newDialog: MeetingDialogData = {
        id,
        type,
        content,
        data,
        zIndex: highestZIndex + 1,
        isActive: true,
        minimized: false,
        maximized: false,
        position
      };
      
      console.log('⭐⭐⭐ CONTEXT: Created new dialog object:', {
        id: newDialog.id,
        type: newDialog.type,
        hasContent: !!newDialog.content,
        zIndex: newDialog.zIndex,
        isActive: newDialog.isActive
      });
      
      // If dialog already exists, update it; otherwise add it
      let newDialogs;
      if (existingIndex >= 0) {
        newDialogs = [...inactiveDialogs];
        newDialogs[existingIndex] = newDialog;
        console.log('⭐⭐⭐ CONTEXT: Updated existing dialog at index:', existingIndex);
      } else {
        newDialogs = [...inactiveDialogs, newDialog];
        console.log('⭐⭐⭐ CONTEXT: Added new dialog to collection');
      }
      
      console.log('⭐⭐⭐ CONTEXT: New dialogs state count:', newDialogs.length);
      console.log('⭐⭐⭐ CONTEXT: New dialogs IDs:', newDialogs.map(d => d.id));
      
      // Update highest z-index
      setHighestZIndex(prev => prev + 1);
      
      return newDialogs;
    });
    
    // Return true to indicate the dialog was opened
    return true;
  }, [highestZIndex, dialogs]);

  // Close a meeting dialog
  const closeMeetingDialog = useCallback((id: string) => {
    console.log('🔍🔍 CONTEXT: Closing dialog with ID:', id);
    
    setDialogs(prevDialogs => {
      console.log('🔍🔍 CONTEXT: Dialogs before closing count:', prevDialogs.length); 
      console.log('🔍🔍 CONTEXT: Dialogs before closing IDs:', prevDialogs.map(d => d.id));
      
      const newDialogs = prevDialogs.filter(dialog => dialog.id !== id);
      
      console.log('🔍🔍 CONTEXT: Dialogs after closing count:', newDialogs.length);
      console.log('🔍🔍 CONTEXT: Dialogs after closing IDs:', newDialogs.map(d => d.id));
      console.log('🔍🔍 CONTEXT: Dialog was found and removed:', newDialogs.length < prevDialogs.length);
      
      return newDialogs;
    });
    
    return true;
  }, []);

  // Focus a dialog (bring to front)
  const focusDialog = useCallback((id: string) => {
    setDialogs(prevDialogs => {
      // Find dialog
      const dialogIndex = prevDialogs.findIndex(d => d.id === id);
      if (dialogIndex === -1) return prevDialogs;
      
      // Set all dialogs to inactive, update z-index
      const newDialogs = prevDialogs.map(d => ({
        ...d,
        isActive: d.id === id,
        zIndex: d.id === id ? highestZIndex + 1 : d.zIndex
      }));
      
      // Update highest z-index
      setHighestZIndex(prev => prev + 1);
      
      return newDialogs;
    });
  }, [highestZIndex]);

  // Minimize/restore dialog
  const minimizeDialog = useCallback((id: string, minimized: boolean) => {
    setDialogs(prevDialogs => {
      return prevDialogs.map(dialog => {
        if (dialog.id === id) {
          return { ...dialog, minimized };
        }
        return dialog;
      });
    });
  }, []);

  // Maximize/restore dialog
  const maximizeDialog = useCallback((id: string, maximized: boolean) => {
    setDialogs(prevDialogs => {
      return prevDialogs.map(dialog => {
        if (dialog.id === id) {
          // If maximizing, save current position/size
          if (maximized && !dialog.maximized) {
            return {
              ...dialog,
              maximized,
              previousPosition: dialog.position,
              previousSize: dialog.size
            };
          }
          // If restoring, retrieve saved position/size
          else if (!maximized && dialog.maximized) {
            return {
              ...dialog,
              maximized,
              position: dialog.previousPosition,
              size: dialog.previousSize,
              previousPosition: undefined,
              previousSize: undefined
            };
          }
          return { ...dialog, maximized };
        }
        return dialog;
      });
    });
  }, []);

  // Check if dialog is open
  const isDialogOpen = useCallback((id: string) => {
    return dialogs.some(dialog => dialog.id === id);
  }, [dialogs]);

  // Get dialog z-index
  const getDialogZIndex = useCallback((id: string) => {
    const dialog = dialogs.find(d => d.id === id);
    
    // If this is a phone dialog, use a very high z-index to ensure visibility
    if (dialog?.type === MeetingDialogType.PHONE) {
      return 9999; // Very high z-index for phone dialogs
    }
    
    return dialog?.zIndex || BASE_Z_INDEX;
  }, [dialogs]);

  // Get dialog data
  const getDialogData = useCallback((id: string) => {
    return dialogs.find(d => d.id === id);
  }, [dialogs]);

  // Get all dialogs
  const getAllDialogs = useCallback(() => {
    return dialogs;
  }, [dialogs]);

  const contextValue = {
    dialogs,
    openMeetingDialog,
    closeMeetingDialog,
    focusDialog,
    minimizeDialog,
    maximizeDialog,
    isDialogOpen,
    getDialogZIndex,
    getDialogData,
    getAllDialogs,
    setDialogs
  };

  return (
    <MeetingDialogContext.Provider value={contextValue}>
      {children}
    </MeetingDialogContext.Provider>
  );
};

// Container component for dialogs
export const MeetingDialogContainer = () => {
  const { dialogs } = useMeetingDialog();
  
  console.log('⭐⭐⭐ CONTAINER: MeetingDialogContainer rendering with dialogs:', {
    count: dialogs.length,
    ids: dialogs.map(d => d.id),
    types: dialogs.map(d => d.type)
  });

  // Add effect to log when container updates
  useEffect(() => {
    console.log('⭐⭐⭐ CONTAINER: MeetingDialogContainer updated with dialogs:', {
      count: dialogs.length,
      ids: dialogs.map(d => d.id),
      types: dialogs.map(d => d.type)
    });
  }, [dialogs]);
  
  return (
    <>
      {dialogs.map(dialog => {
        console.log('⭐⭐⭐ CONTAINER: Rendering dialog in container:', {
          id: dialog.id,
          type: dialog.type,
          hasContent: !!dialog.content
        });
        
        return (
          <React.Fragment key={dialog.id}>
            {dialog.content}
          </React.Fragment>
        );
      })}
    </>
  );
}; 