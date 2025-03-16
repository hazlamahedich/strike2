'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Define dialog data structure
export interface DialogData {
  id: string;
  component: ReactNode;
  zIndex: number;
  isActive: boolean;
  minimized?: boolean;
  maximized?: boolean;
  // Track previous size/position for restore from maximize
  previousPosition?: { x: number; y: number };
  previousSize?: { width: number | string; height: number | string };
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

// Define context shape
interface ImprovedDialogContextType {
  openDialogs: DialogData[];
  openDialog: (id: string, component: React.ReactNode, options?: { maximized?: boolean }) => void;
  closeDialog: (id: string) => void;
  focusDialog: (id: string) => void;
  minimizeDialog: (id: string, minimized: boolean) => void;
  maximizeDialog: (id: string, maximized: boolean) => void;
  isDialogOpen: (id: string) => boolean;
  getDialogZIndex: (id: string) => number;
  getDialogData: (id: string) => DialogData | undefined;
  arrangeDialogsCascade: () => void;
  arrangeDialogsTile: (direction: 'horizontal' | 'vertical') => void;
}

// Create context with default values
const ImprovedDialogContext = createContext<ImprovedDialogContextType>({
  openDialogs: [],
  openDialog: () => {},
  closeDialog: () => {},
  focusDialog: () => {},
  minimizeDialog: () => {},
  maximizeDialog: () => {},
  isDialogOpen: () => false,
  getDialogZIndex: () => 50,
  getDialogData: () => undefined,
  arrangeDialogsCascade: () => {},
  arrangeDialogsTile: () => {},
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
  const openDialog = useCallback((id: string, component: React.ReactNode, options?: { maximized?: boolean }) => {
    console.log(`[DialogContext] Opening dialog: ${id}${options?.maximized ? ' (maximized)' : ''}`);
    
    // DIRECT APPROACH: Replace the entire state setter with a simpler implementation
    setOpenDialogs(prevDialogs => {
      // First check if it already exists
      const existingIndex = prevDialogs.findIndex(d => d.id === id);
      
      // Set all dialogs to inactive
      const inactiveDialogs = prevDialogs.map(d => ({
        ...d,
        isActive: false
      }));
      
      // Create the new dialog with explicit properties
      const newDialog = {
        id,
        component,
        zIndex: highestZIndex + 1,
        isActive: true,
        minimized: false,
        maximized: options?.maximized || false
      };
      
      console.log(`[DialogContext] Creating dialog with explicit properties:`, newDialog);
      
      // If dialog already exists, update it; otherwise add it
      if (existingIndex >= 0) {
        const result = [...inactiveDialogs];
        result[existingIndex] = newDialog;
        return result;
      } else {
        // Update the highest z-index
        setHighestZIndex(highestZIndex + 1);
        return [...inactiveDialogs, newDialog];
      }
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

  // Focus a dialog
  const focusDialog = useCallback((dialogId: string) => {
    console.log(`[DialogContext] Focusing dialog: ${dialogId}`);
    
    setOpenDialogs(prev => {
      // Find the dialog to focus
      const dialogToFocus = prev.find(dialog => dialog.id === dialogId);
      
      // If dialog doesn't exist or is already active and not minimized, return unchanged
      if (!dialogToFocus) {
        console.warn(`[DialogContext] Cannot focus dialog ${dialogId}: dialog not found`);
        return prev;
      }
      
      if (dialogToFocus.isActive && !dialogToFocus.minimized) {
        console.log(`[DialogContext] Dialog ${dialogId} is already active and not minimized`);
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
        // Make sure dialog is not minimized when focused
        updated[dialogIndex] = {
          ...updated[dialogIndex],
          isActive: true,
          minimized: false,  // Ensure dialog is not minimized when focused
          zIndex: newZIndex
        };
        
        console.log(`[DialogContext] Dialog ${dialogId} set to active, not minimized, z-index ${newZIndex}`);
      }
      
      // Update our highest z-index tracker
      setHighestZIndex(newZIndex);
      
      console.log(`[DialogContext] Dialog ${dialogId} now focused with z-index ${newZIndex}`);
      
      // Set this as the active dialog
      setActiveDialogId(dialogId);
      
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
    
    // Log the current state of the dialog
    const dialogBeforeUpdate = openDialogs.find(d => d.id === id);
    console.log(`[DialogContext] Dialog state before update:`, 
      dialogBeforeUpdate ? {
        id: dialogBeforeUpdate.id,
        isActive: dialogBeforeUpdate.isActive,
        minimized: dialogBeforeUpdate.minimized,
        maximized: dialogBeforeUpdate.maximized,
        zIndex: dialogBeforeUpdate.zIndex
      } : 'Not found'
    );
    
    setOpenDialogs(prevDialogs => {
      const updatedDialogs = prevDialogs.map(dialog => {
        if (dialog.id === id) {
          console.log(`[DialogContext] Updating dialog ${id} minimized state from ${dialog.minimized} to ${minimized}`);
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
      
      // Log what we're returning
      const updatedDialog = updatedDialogs.find(d => d.id === id);
      console.log(`[DialogContext] Dialog state after update:`, 
        updatedDialog ? {
          id: updatedDialog.id,
          isActive: updatedDialog.isActive,
          minimized: updatedDialog.minimized, 
          maximized: updatedDialog.maximized,
          zIndex: updatedDialog.zIndex
        } : 'Not found'
      );
      
      return updatedDialogs;
    });
    
    // Ensure proper focus when restoring
    if (!minimized) {
      console.log(`[DialogContext] After restore, setting active dialog to ${id} and focusing`);
      setActiveDialogId(id);
      
      // Add a slight delay to ensure state is updated first
      setTimeout(() => {
        focusDialog(id);
        
        // Verify dialog state after focus
        setTimeout(() => {
          const dialogAfterFocus = openDialogs.find(d => d.id === id);
          console.log(`[DialogContext] Dialog state after focus:`, 
            dialogAfterFocus ? {
              id: dialogAfterFocus.id,
              isActive: dialogAfterFocus.isActive,
              minimized: dialogAfterFocus.minimized,
              maximized: dialogAfterFocus.maximized,
              zIndex: dialogAfterFocus.zIndex
            } : 'Not found'
          );
          
          // Check if DOM element exists and is visible
          const dialogElement = document.querySelector(`[data-dialog-id="${id}"]`);
          console.log(`[DialogContext] DOM element for ${id} after focus:`, 
            dialogElement ? {
              dataMinimized: dialogElement.getAttribute('data-minimized'),
              display: window.getComputedStyle(dialogElement).display,
              visibility: window.getComputedStyle(dialogElement).visibility
            } : 'Not found in DOM'
          );
        }, 50);
      }, 50);
    }
  }, [openDialogs, focusDialog, setActiveDialogId]);

  // Add the maximizeDialog function
  const maximizeDialog = useCallback((id: string, maximized: boolean) => {
    console.log(`[DialogContext] Attempting to ${maximized ? 'maximize' : 'restore'} dialog: ${id}`);
    
    // First check if the dialog exists
    const dialogExists = openDialogs.some(dialog => dialog.id === id);
    if (!dialogExists) {
      console.error(`[DialogContext] Cannot maximize dialog: ${id} - Dialog does not exist in current state`);
      console.log(`[DialogContext] Current dialogs:`, openDialogs.map(d => d.id));
      return;
    }
    
    // Log the dialog state before update
    const dialogBeforeUpdate = openDialogs.find(d => d.id === id);
    console.log(`[DialogContext] Dialog state before maximize:`, 
      dialogBeforeUpdate ? {
        id: dialogBeforeUpdate.id,
        isActive: dialogBeforeUpdate.isActive,
        minimized: dialogBeforeUpdate.minimized,
        maximized: dialogBeforeUpdate.maximized,
        zIndex: dialogBeforeUpdate.zIndex
      } : 'Not found'
    );
    
    setOpenDialogs(prevDialogs => {
      // Double check that the dialog still exists at this point
      const dialogIndex = prevDialogs.findIndex(dialog => dialog.id === id);
      if (dialogIndex === -1) {
        console.error(`[DialogContext] Dialog ${id} not found in state during maximization`);
        return prevDialogs;
      }
      
      console.log(`[DialogContext] ${maximized ? 'Maximizing' : 'Restoring'} dialog: ${id}`);
      
      // Create a deep copy of the dialogs array to avoid mutation
      const updatedDialogs = prevDialogs.map((dialog, index) => {
        // If this is the dialog we're maximizing
        if (index === dialogIndex) {
          const updatedDialog = { ...dialog };
          
          if (maximized) {
            // Save current position and size before maximizing
            updatedDialog.previousPosition = { x: dialog.position?.x || 0, y: dialog.position?.y || 0 };
            updatedDialog.previousSize = { width: dialog.size?.width || 800, height: dialog.size?.height || 600 };
            updatedDialog.maximized = true;
            updatedDialog.minimized = false; // Can't be minimized and maximized at the same time
            updatedDialog.isActive = true;  // Ensure dialog is active
          } else {
            // Restore previous position and size
            if (dialog.previousPosition) {
              updatedDialog.position = { ...dialog.previousPosition };
            }
            if (dialog.previousSize) {
              updatedDialog.size = { ...dialog.previousSize };
            }
            updatedDialog.maximized = false;
          }
          
          return updatedDialog;
        }
        // If we're maximizing a dialog, make all other dialogs inactive
        else if (maximized && dialog.isActive) {
          return {
            ...dialog,
            isActive: false
          };
        }
        
        return dialog;
      });
      
      // Log the updated dialog
      const updatedDialog = updatedDialogs.find(d => d.id === id);
      console.log(`[DialogContext] Dialog ${id} updated:`, {
        maximized: updatedDialog?.maximized,
        minimized: updatedDialog?.minimized,
        isActive: updatedDialog?.isActive,
        position: updatedDialog?.position,
        size: updatedDialog?.size
      });
      
      return updatedDialogs;
    });
    
    // Make sure the dialog is focused and active
    setActiveDialogId(id);
    
    // Add a slight delay to ensure state is updated first
    setTimeout(() => {
      focusDialog(id);
      
      // Verify dialog state after update
      setTimeout(() => {
        const dialogAfterUpdate = openDialogs.find(d => d.id === id);
        console.log(`[DialogContext] Dialog state after maximize:`, 
          dialogAfterUpdate ? {
            id: dialogAfterUpdate.id,
            isActive: dialogAfterUpdate.isActive,
            minimized: dialogAfterUpdate.minimized,
            maximized: dialogAfterUpdate.maximized,
            zIndex: dialogAfterUpdate.zIndex
          } : 'Not found'
        );
        
        // Check if DOM element exists and is visible
        const dialogElement = document.querySelector(`[data-dialog-id="${id}"]`);
        if (dialogElement) {
          console.log(`[DialogContext] DOM element for ${id} after maximize:`, {
            dataMaximized: dialogElement.getAttribute('data-maximized'),
            display: window.getComputedStyle(dialogElement).display,
            visibility: window.getComputedStyle(dialogElement).visibility
          });
        } else {
          console.warn(`[DialogContext] DOM element for ${id} not found after maximize`);
        }
      }, 100);
    }, 50);
  }, [openDialogs, setActiveDialogId, focusDialog]);

  // Window management: cascade layout
  const arrangeDialogsCascade = useCallback(() => {
    console.log(`[DialogContext] Arranging dialogs in cascade layout`);
    
    setOpenDialogs(prevDialogs => {
      // Only arrange non-minimized dialogs
      const visibleDialogs = prevDialogs.filter(d => !d.minimized);
      if (visibleDialogs.length === 0) return prevDialogs;
      
      // Get window dimensions
      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      
      // Calculate cascade offsets
      const offsetX = 40;
      const offsetY = 40;
      const maxRows = Math.floor((windowHeight - 100) / offsetY);
      
      return prevDialogs.map((dialog, index) => {
        // Skip minimized dialogs
        if (dialog.minimized) return dialog;
        
        // Calculate position in cascade
        const cascadeIndex = index % visibleDialogs.length;
        const row = cascadeIndex % maxRows;
        const col = Math.floor(cascadeIndex / maxRows);
        
        const x = 50 + (col * offsetX);
        const y = 50 + (row * offsetY);
        
        // Reset maximized state
        return {
          ...dialog,
          maximized: false,
          previousPosition: { x, y }
        };
      });
    });
  }, []);

  // Window management: tile layout
  const arrangeDialogsTile = useCallback((direction: 'horizontal' | 'vertical') => {
    console.log(`[DialogContext] Arranging dialogs in ${direction} tile layout`);
    
    setOpenDialogs(prevDialogs => {
      // Only arrange non-minimized dialogs
      const visibleDialogs = prevDialogs.filter(d => !d.minimized);
      if (visibleDialogs.length === 0) return prevDialogs;
      
      // Get window dimensions
      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      
      // Calculate tiles
      const count = visibleDialogs.length;
      let rows = 1, cols = 1;
      
      if (direction === 'horizontal') {
        // Arrange in a single row with multiple columns
        cols = count;
      } else {
        // Arrange in a single column with multiple rows
        rows = count;
      }
      
      // Calculate tile dimensions
      const tileWidth = windowWidth / cols;
      const tileHeight = (windowHeight - 100) / rows; // Subtract height for taskbar
      
      return prevDialogs.map((dialog, index) => {
        // Skip minimized dialogs
        if (dialog.minimized) return dialog;
        
        // Calculate position in grid
        const visibleIndex = visibleDialogs.findIndex(d => d.id === dialog.id);
        if (visibleIndex === -1) return dialog;
        
        let row = 0, col = 0;
        
        if (direction === 'horizontal') {
          col = visibleIndex;
        } else {
          row = visibleIndex;
        }
        
        const x = col * tileWidth;
        const y = row * tileHeight;
        
        // Reset maximized state and set new position/size
        return {
          ...dialog,
          maximized: false,
          previousPosition: { x, y },
          previousSize: { 
            width: tileWidth - 20, // Subtract padding
            height: tileHeight - 20 
          }
        };
      });
    });
  }, []);

  return (
    <ImprovedDialogContext.Provider
      value={{
        openDialogs,
        openDialog,
        closeDialog,
        focusDialog,
        minimizeDialog,
        maximizeDialog,
        isDialogOpen,
        getDialogZIndex,
        getDialogData,
        arrangeDialogsCascade,
        arrangeDialogsTile
      }}
    >
      {children}
    </ImprovedDialogContext.Provider>
  );
}; 