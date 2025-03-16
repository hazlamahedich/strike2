'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Meeting } from '@/lib/types/meeting';

// Define meeting dialog types
export enum MeetingDialogType {
  DETAILS = 'details',
  SCHEDULE = 'schedule',
  EDIT = 'edit',
  RESCHEDULE = 'reschedule',
  CANCEL = 'cancel',
  SUMMARY = 'summary',
  COMPREHENSIVE_SUMMARY = 'comprehensive_summary'
}

// Define dialog data structure
export interface MeetingDialogData {
  id: string;
  type: MeetingDialogType;
  meeting?: Meeting;
  leadId?: number;
  component: ReactNode;
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
  openDialogs: MeetingDialogData[];
  openMeetingDialog: (
    id: string, 
    type: MeetingDialogType, 
    component: React.ReactNode, 
    options?: { 
      meeting?: Meeting; 
      leadId?: number;
      maximized?: boolean 
    }
  ) => void;
  closeMeetingDialog: (id: string) => void;
  focusMeetingDialog: (id: string) => void;
  minimizeMeetingDialog: (id: string, minimized: boolean) => void;
  maximizeMeetingDialog: (id: string, maximized: boolean) => void;
  isMeetingDialogOpen: (id: string) => boolean;
  getMeetingDialogZIndex: (id: string) => number;
  getMeetingDialogData: (id: string) => MeetingDialogData | undefined;
  getAllMeetingDialogs: () => MeetingDialogData[];
  arrangeDialogsCascade: () => void;
  arrangeDialogsTile: () => void;
}

// Create context with default values
const MeetingDialogContext = createContext<MeetingDialogContextType>({
  openDialogs: [],
  openMeetingDialog: () => {},
  closeMeetingDialog: () => {},
  focusMeetingDialog: () => {},
  minimizeMeetingDialog: () => {},
  maximizeMeetingDialog: () => {},
  isMeetingDialogOpen: () => false,
  getMeetingDialogZIndex: () => 50,
  getMeetingDialogData: () => undefined,
  getAllMeetingDialogs: () => [],
  arrangeDialogsCascade: () => {},
  arrangeDialogsTile: () => {},
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
  const [openDialogs, setOpenDialogs] = useState<MeetingDialogData[]>([]);
  const [highestZIndex, setHighestZIndex] = useState(BASE_Z_INDEX);

  // Function to calculate cascade position
  const calculateCascadePosition = (index: number) => {
    // Base position for the first dialog
    const baseX = window.innerWidth / 2 - 300; // Center - half of average dialog width
    const baseY = window.innerHeight / 2 - 200; // Center - half of average dialog height
    
    // Offset each subsequent dialog
    const offsetX = 40;
    const offsetY = 40;
    
    return {
      x: baseX + (index * offsetX),
      y: baseY + (index * offsetY)
    };
  };

  // Function to calculate tile position (grid layout)
  const calculateTilePosition = (index: number, total: number) => {
    // Determine grid size based on number of dialogs
    const cols = Math.ceil(Math.sqrt(total));
    const rows = Math.ceil(total / cols);
    
    // Calculate position in grid
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    // Calculate actual position
    const dialogWidth = 600; // Approximate width
    const dialogHeight = 400; // Approximate height
    const padding = 20; // Space between dialogs
    
    const availableWidth = window.innerWidth - padding * (cols + 1);
    const availableHeight = window.innerHeight - padding * (rows + 1);
    
    const tileWidth = Math.min(dialogWidth, availableWidth / cols);
    const tileHeight = Math.min(dialogHeight, availableHeight / rows);
    
    return {
      x: padding + col * (tileWidth + padding),
      y: padding + row * (tileHeight + padding),
      size: {
        width: tileWidth,
        height: tileHeight
      }
    };
  };

  // Function to arrange dialogs in a cascade pattern
  const arrangeDialogsCascade = useCallback(() => {
    setOpenDialogs(prevDialogs => {
      // Only arrange non-minimized dialogs
      const activeDialogs = prevDialogs.filter(dialog => !dialog.minimized);
      
      // Create a new array with updated positions
      return prevDialogs.map((dialog, index) => {
        // Skip minimized dialogs
        if (dialog.minimized) return dialog;
        
        // Find this dialog's index among active dialogs
        const activeIndex = activeDialogs.findIndex(d => d.id === dialog.id);
        
        // Calculate new position
        const newPosition = calculateCascadePosition(activeIndex);
        
        // Update dialog with new position
        return {
          ...dialog,
          position: newPosition,
          // Clear size to use default
          size: undefined,
          // Clear maximized state
          maximized: false,
          previousPosition: undefined,
          previousSize: undefined
        };
      });
    });
  }, []);

  // Function to arrange dialogs in a grid
  const arrangeDialogsTile = useCallback(() => {
    setOpenDialogs(prevDialogs => {
      // Only arrange non-minimized dialogs
      const activeDialogs = prevDialogs.filter(dialog => !dialog.minimized);
      const totalActive = activeDialogs.length;
      
      // Create a new array with updated positions
      return prevDialogs.map((dialog, index) => {
        // Skip minimized dialogs
        if (dialog.minimized) return dialog;
        
        // Find this dialog's index among active dialogs
        const activeIndex = activeDialogs.findIndex(d => d.id === dialog.id);
        
        // Calculate new position and size
        const { x, y, size } = calculateTilePosition(activeIndex, totalActive);
        
        // Update dialog with new position and size
        return {
          ...dialog,
          position: { x, y },
          size,
          // Clear maximized state
          maximized: false,
          previousPosition: undefined,
          previousSize: undefined
        };
      });
    });
  }, []);

  // Open a new meeting dialog
  const openMeetingDialog = useCallback((
    id: string, 
    type: MeetingDialogType, 
    component: React.ReactNode, 
    options?: { 
      meeting?: Meeting; 
      leadId?: number;
      maximized?: boolean 
    }
  ) => {
    console.log(`[MeetingDialogContext] Opening dialog: ${id} (${type})${options?.maximized ? ' (maximized)' : ''}`);
    
    setOpenDialogs(prevDialogs => {
      // First check if it already exists
      const existingIndex = prevDialogs.findIndex(d => d.id === id);
      
      // Set all dialogs to inactive
      const inactiveDialogs = prevDialogs.map(d => ({
        ...d,
        isActive: false
      }));
      
      // Calculate dialog position based on how many are already open
      const nonMinimizedDialogs = prevDialogs.filter(d => !d.minimized).length;
      const position = calculateCascadePosition(nonMinimizedDialogs);
      
      // Create the new dialog with explicit properties
      const newDialog: MeetingDialogData = {
        id,
        type,
        meeting: options?.meeting,
        leadId: options?.leadId,
        component,
        zIndex: highestZIndex + 1,
        isActive: true,
        minimized: false,
        maximized: options?.maximized || false,
        position: options?.maximized ? undefined : position
      };
      
      console.log(`[MeetingDialogContext] Creating dialog with explicit properties:`, newDialog);
      
      // If dialog already exists, update it; otherwise add it
      if (existingIndex >= 0) {
        const result = [...inactiveDialogs];
        result[existingIndex] = newDialog;
        
        // Also update z-index
        setHighestZIndex(highestZIndex + 1);
        
        return result;
      } else {
        // Update the highest z-index
        setHighestZIndex(highestZIndex + 1);
        
        // After adding a new dialog, automatically arrange if there are multiple
        const updatedDialogs = [...inactiveDialogs, newDialog];
        
        // If there are 3 or more dialogs, arrange them in a better layout
        if (updatedDialogs.filter(d => !d.minimized).length >= 3) {
          // Use a timeout to ensure the dialog is added first
          setTimeout(() => {
            arrangeDialogsTile();
          }, 50);
        }
        
        return updatedDialogs;
      }
    });
  }, [highestZIndex, arrangeDialogsTile]);

  // Close a meeting dialog
  const closeMeetingDialog = useCallback((id: string) => {
    setOpenDialogs(prevDialogs => {
      const dialogIndex = prevDialogs.findIndex(dialog => dialog.id === id);
      
      if (dialogIndex === -1) return prevDialogs;
      
      const newDialogs = prevDialogs.filter(dialog => dialog.id !== id);
      
      // If we still have dialogs, activate the one with the highest z-index
      if (newDialogs.length > 0) {
        const highestDialog = newDialogs.reduce((highest, current) => 
          current.zIndex > highest.zIndex ? current : highest
        , newDialogs[0]);
        
        return newDialogs.map(dialog => ({
          ...dialog,
          isActive: dialog.id === highestDialog.id
        }));
      }
      
      return newDialogs;
    });
  }, []);

  // Focus a meeting dialog
  const focusMeetingDialog = useCallback((dialogId: string) => {
    console.log(`[MeetingDialogContext] Focusing dialog: ${dialogId}`);
    
    setOpenDialogs(prev => {
      // Find the dialog to focus
      const dialogToFocus = prev.find(dialog => dialog.id === dialogId);
      
      // If dialog doesn't exist or is already active and not minimized, return unchanged
      if (!dialogToFocus) {
        console.warn(`[MeetingDialogContext] Cannot focus dialog ${dialogId}: dialog not found`);
        return prev;
      }
      
      if (dialogToFocus.isActive && !dialogToFocus.minimized) {
        console.log(`[MeetingDialogContext] Dialog ${dialogId} is already active and not minimized`);
        return prev;
      }
      
      // Update all dialog active states
      const updated = [...prev];
      
      // Calculate new highest z-index with bigger margin to avoid conflicts
      const newZIndex = highestZIndex + 50;
      
      // Mark all dialogs as inactive first
      updated.forEach((dialog) => {
        if (dialog.isActive) {
          dialog.isActive = false;
        }
      });
      
      // Find the dialog index
      const dialogIndex = updated.findIndex(dialog => dialog.id === dialogId);
      if (dialogIndex !== -1) {
        // Make dialog active but preserve its minimized state
        const currentMinimized = updated[dialogIndex].minimized || false;
        
        updated[dialogIndex] = {
          ...updated[dialogIndex],
          isActive: true,
          // Keep current minimized state instead of forcing it to false
          minimized: currentMinimized,
          zIndex: newZIndex
        };
        
        console.log(`[MeetingDialogContext] Dialog ${dialogId} set to active, minimized=${currentMinimized}, z-index ${newZIndex}`);
      }
      
      // Update our highest z-index tracker
      setHighestZIndex(newZIndex);
      
      console.log(`[MeetingDialogContext] Dialog ${dialogId} now focused with z-index ${newZIndex}`);
      
      return updated;
    });
  }, [highestZIndex]);

  // Check if a meeting dialog is open
  const isMeetingDialogOpen = useCallback((id: string) => {
    return openDialogs.some(dialog => dialog.id === id);
  }, [openDialogs]);

  // Get a meeting dialog's z-index
  const getMeetingDialogZIndex = useCallback((dialogId: string) => {
    const dialog = openDialogs.find(d => d.id === dialogId);
    if (dialog) {
      return dialog.zIndex;
    }
    
    // Default z-index for new dialogs - make it higher than any existing dialog
    return highestZIndex + 20; // Use a bigger increment to avoid z-index conflicts
  }, [openDialogs, highestZIndex]);

  // Get meeting dialog data
  const getMeetingDialogData = useCallback((id: string) => {
    return openDialogs.find(dialog => dialog.id === id);
  }, [openDialogs]);

  // Get all meeting dialogs
  const getAllMeetingDialogs = useCallback(() => {
    return openDialogs;
  }, [openDialogs]);

  // Add the minimizeMeetingDialog function
  const minimizeMeetingDialog = useCallback((id: string, minimized: boolean) => {
    console.log(`[MeetingDialogContext] ${minimized ? 'Minimizing' : 'Restoring'} dialog: ${id}`);
    
    // Log current state of dialog being modified
    const dialogBeforeChange = openDialogs.find(dialog => dialog.id === id);
    console.log(`[MeetingDialogContext] Dialog ${id} before change:`, {
      id,
      isActive: dialogBeforeChange?.isActive,
      currentMinimized: dialogBeforeChange?.minimized,
      requestedMinimized: minimized,
      zIndex: dialogBeforeChange?.zIndex
    });
    
    setOpenDialogs(prevDialogs => {
      const dialogIndex = prevDialogs.findIndex(dialog => dialog.id === id);
      
      if (dialogIndex === -1) {
        console.log(`[MeetingDialogContext] Cannot minimize dialog ${id}: dialog not found`);
        return prevDialogs;
      }
      
      console.log(`[MeetingDialogContext] Updating dialog ${id} at index ${dialogIndex}, setting minimized=${minimized}`);
      
      const updatedDialogs = prevDialogs.map(dialog => {
        if (dialog.id === id) {
          const updated = {
            ...dialog,
            minimized
          };
          console.log(`[MeetingDialogContext] Updated dialog ${id}:`, {
            minimizedBefore: dialog.minimized,
            minimizedAfter: updated.minimized
          });
          return updated;
        }
        return dialog;
      });
      
      console.log(`[MeetingDialogContext] All dialogs after update:`, updatedDialogs.map(d => ({
        id: d.id,
        minimized: d.minimized,
        isActive: d.isActive
      })));
      
      return updatedDialogs;
    });
  }, [openDialogs]);

  // Add the maximizeMeetingDialog function
  const maximizeMeetingDialog = useCallback((id: string, maximized: boolean) => {
    console.log(`[MeetingDialogContext] ${maximized ? 'Maximizing' : 'Restoring'} dialog: ${id}`);
    
    setOpenDialogs(prevDialogs => {
      const updatedDialogs = prevDialogs.map(dialog => {
        if (dialog.id === id) {
          const currentPosition = dialog.position || { x: 0, y: 0 };
          const currentSize = dialog.size || { width: 'auto', height: 'auto' };
          
          // When maximizing, store current position and size for later restoration
          if (maximized) {
            return {
              ...dialog,
              maximized: true,
              previousPosition: currentPosition,
              previousSize: currentSize,
              // Clear current position/size to let CSS handle maximized state
              position: undefined,
              size: undefined
            };
          } else {
            // When restoring, reapply stored position and size
            return {
              ...dialog,
              maximized: false,
              position: dialog.previousPosition,
              size: dialog.previousSize,
              // Clear stored values
              previousPosition: undefined,
              previousSize: undefined
            };
          }
        }
        return dialog;
      });
      
      return updatedDialogs;
    });
  }, []);

  // Create the context value
  const contextValue = {
    openDialogs,
    openMeetingDialog,
    closeMeetingDialog,
    focusMeetingDialog,
    minimizeMeetingDialog,
    maximizeMeetingDialog,
    isMeetingDialogOpen,
    getMeetingDialogZIndex,
    getMeetingDialogData,
    getAllMeetingDialogs,
    arrangeDialogsCascade,
    arrangeDialogsTile,
  };

  return (
    <MeetingDialogContext.Provider value={contextValue}>
      {children}
    </MeetingDialogContext.Provider>
  );
}; 