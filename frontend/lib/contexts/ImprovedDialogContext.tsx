'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Define dialog data structure
export interface DialogData {
  id: string;
  component: React.ReactNode;
  zIndex: number;
  isActive: boolean;
  minimized?: boolean;
}

// Define context shape
interface ImprovedDialogContextType {
  openDialogs: DialogData[];
  openDialog: (id: string, component: React.ReactNode) => void;
  closeDialog: (id: string) => void;
  focusDialog: (id: string) => void;
  minimizeDialog: (id: string, minimized: boolean) => void;
  isDialogOpen: (id: string) => boolean;
  getDialogZIndex: (id: string) => number;
  getDialogData: (id: string) => DialogData | undefined;
}

// Create context with default values
const ImprovedDialogContext = createContext<ImprovedDialogContextType>({
  openDialogs: [],
  openDialog: () => {},
  closeDialog: () => {},
  focusDialog: () => {},
  minimizeDialog: () => {},
  isDialogOpen: () => false,
  getDialogZIndex: () => 50,
  getDialogData: () => undefined,
});

// Hook to use dialog context
export const useImprovedDialog = () => useContext(ImprovedDialogContext);

// Base Z-index for dialogs
const BASE_Z_INDEX = 50;

// Provider component
interface ImprovedDialogProviderProps {
  children: ReactNode;
}

export const ImprovedDialogProvider = ({ children }: ImprovedDialogProviderProps) => {
  const [openDialogs, setOpenDialogs] = useState<DialogData[]>([]);
  const [highestZIndex, setHighestZIndex] = useState(BASE_Z_INDEX);
  const [activeDialogId, setActiveDialogId] = useState<string | null>(null);

  // Open a new dialog
  const openDialog = useCallback((id: string, component: React.ReactNode) => {
    setOpenDialogs(prevDialogs => {
      // Check if dialog already exists
      const existingDialogIndex = prevDialogs.findIndex(dialog => dialog.id === id);
      
      if (existingDialogIndex !== -1) {
        // If it exists, focus it instead of opening again
        return prevDialogs.map((dialog, index) => ({
          ...dialog,
          isActive: index === existingDialogIndex,
          zIndex: index === existingDialogIndex ? highestZIndex + 1 : dialog.zIndex
        }));
      }
      
      // If it's a new dialog, add it with a higher z-index
      const newZIndex = highestZIndex + 1;
      setHighestZIndex(newZIndex);
      
      // Make all other dialogs inactive
      const updatedDialogs = prevDialogs.map(dialog => ({
        ...dialog,
        isActive: false
      }));
      
      // Add the new dialog
      return [
        ...updatedDialogs,
        {
          id,
          component,
          zIndex: newZIndex,
          isActive: true
        }
      ];
    });
  }, [highestZIndex]);

  // Close a dialog
  const closeDialog = useCallback((id: string) => {
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

  // Focus an existing dialog
  const focusDialog = useCallback((dialogId: string) => {
    console.log(`[DialogContext] Focusing dialog: ${dialogId}`);
    setOpenDialogs((prev) => {
      // If dialog doesn't exist, do nothing
      const dialogToFocus = prev.find(dialog => dialog.id === dialogId);
      if (!dialogToFocus) {
        console.log(`[DialogContext] Cannot focus dialog ${dialogId}: doesn't exist`);
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
      
      // Mark this dialog as active and bring it to front with highest z-index
      dialogToFocus.isActive = true;
      dialogToFocus.zIndex = newZIndex;
      
      // Update our highest z-index tracker
      setHighestZIndex(newZIndex);
      
      console.log(`[DialogContext] Dialog ${dialogId} now focused with z-index ${newZIndex}`);
      
      // Use a timeout to log the final state after state update is complete
      setTimeout(() => {
        // Find the dialog DOM element and apply focus
        const dialogElement = document.querySelector(`[data-dialog-id="${dialogId}"]`);
        if (dialogElement) {
          console.log(`[DialogContext] Found DOM element for dialog ${dialogId}, applying focus`);
          
          // Force z-index update directly on the DOM element for immediate effect
          (dialogElement as HTMLElement).style.zIndex = `${newZIndex}`;
          
          // Try to focus the dialog element itself to ensure keyboard accessibility
          try {
            (dialogElement as HTMLElement).focus({ preventScroll: true });
            console.log(`[DialogContext] Applied focus to dialog ${dialogId}`);
          } catch (err) {
            console.error(`[DialogContext] Error focusing dialog ${dialogId}:`, err);
          }
        } else {
          console.log(`[DialogContext] Could not find DOM element for dialog ${dialogId}`);
        }
      }, 0);
      
      return updated;
    });
    
    // Set this as the active dialog
    setActiveDialogId(dialogId);
  }, [highestZIndex]);

  // Check if a dialog is open
  const isDialogOpen = useCallback((id: string) => {
    return openDialogs.some(dialog => dialog.id === id);
  }, [openDialogs]);

  // Get a dialog's z-index
  const getDialogZIndex = useCallback((dialogId: string) => {
    const dialog = openDialogs.find(d => d.id === dialogId);
    if (dialog) {
      return dialog.zIndex;
    }
    
    // Default z-index for new dialogs - make it higher than any existing dialog
    return highestZIndex + 20; // Use a bigger increment to avoid z-index conflicts
  }, [openDialogs, highestZIndex]);

  // Get dialog data
  const getDialogData = useCallback((id: string) => {
    return openDialogs.find(dialog => dialog.id === id);
  }, [openDialogs]);

  // Add the minimizeDialog function
  const minimizeDialog = useCallback((id: string, minimized: boolean) => {
    console.log(`[DialogContext] ${minimized ? 'Minimizing' : 'Restoring'} dialog: ${id}`);
    
    setOpenDialogs(prevDialogs => {
      return prevDialogs.map(dialog => {
        if (dialog.id === id) {
          // Update the minimized state
          return {
            ...dialog,
            minimized,
            // If restoring, also make it active
            isActive: minimized ? dialog.isActive : true
          };
        }
        // If restoring a dialog and making it active, make other dialogs inactive
        if (!minimized && dialog.id !== id && dialog.isActive) {
          return {
            ...dialog,
            isActive: false
          };
        }
        return dialog;
      });
    });
    
    // If restoring, also focus the dialog
    if (!minimized) {
      focusDialog(id);
    }
  }, [focusDialog]);

  return (
    <ImprovedDialogContext.Provider
      value={{
        openDialogs,
        openDialog,
        closeDialog,
        focusDialog,
        minimizeDialog,
        isDialogOpen,
        getDialogZIndex,
        getDialogData
      }}
    >
      {children}
    </ImprovedDialogContext.Provider>
  );
}; 