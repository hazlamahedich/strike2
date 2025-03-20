'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ContextualEmailDialog } from '../components/communications/ContextualEmailDialog';
import { v4 as uuidv4 } from 'uuid';

// Define the types for the Lead data
interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

// Define dialog data structure
interface EmailDialogData {
  id: string;
  lead: Lead;
  zIndex: number;
  isActive: boolean;
  minimized: boolean;
  position: { x: number; y: number } | null;
}

// Define the context type
interface EmailDialogContextType {
  dialogs: EmailDialogData[];
  openEmailDialog: (lead: Lead) => void;
  closeEmailDialog: (id: string) => void;
  minimizeDialog: (id: string, minimized: boolean) => void;
  focusDialog: (id: string) => void;
  updateDialogPosition: (dialogId: string, position: { x: number; y: number }) => void;
  isDialogOpen: (id: string) => boolean;
  getDialogZIndex: (id: string) => number;
}

// Create the context with default values
const EmailDialogContext = createContext<EmailDialogContextType>({
  dialogs: [],
  openEmailDialog: () => {},
  closeEmailDialog: () => {},
  minimizeDialog: () => {},
  focusDialog: () => {},
  updateDialogPosition: () => {},
  isDialogOpen: () => false,
  getDialogZIndex: () => 50,
});

// Create a provider component
export function EmailDialogProvider({ children }: { children: ReactNode }) {
  console.log("⭐⭐⭐ EMAIL DIALOG PROVIDER - Rendering");
  
  const [dialogs, setDialogs] = useState<EmailDialogData[]>([]);
  
  // Helper function to get the highest z-index of all dialogs
  const getHighestZIndex = useCallback(() => {
    if (dialogs.length === 0) return 100;
    return Math.max(...dialogs.map(d => d.zIndex)) + 1;
  }, [dialogs]);
  
  // Focus a specific dialog (bring to front)
  const focusDialog = useCallback((dialogId: string) => {
    console.log("⭐⭐⭐ EMAIL DIALOG PROVIDER - Focusing dialog", dialogId);
    
    setDialogs(prevDialogs => {
      // Find the dialog to focus
      const dialogIndex = prevDialogs.findIndex(d => d.id === dialogId);
      if (dialogIndex === -1) return prevDialogs;
      
      // Make a copy of the dialogs array
      const updatedDialogs = [...prevDialogs];
      
      // Update the z-index of the focused dialog
      const newZIndex = getHighestZIndex();
      updatedDialogs[dialogIndex] = {
        ...updatedDialogs[dialogIndex],
        isActive: true,
        zIndex: newZIndex,
        minimized: false
      };
      
      // Set all other dialogs as inactive
      for (let i = 0; i < updatedDialogs.length; i++) {
        if (i !== dialogIndex) {
          updatedDialogs[i] = { ...updatedDialogs[i], isActive: false };
        }
      }
      
      return updatedDialogs;
    });
  }, [getHighestZIndex, dialogs]);
  
  // Function to open the email dialog
  const openEmailDialog = useCallback((lead: Lead) => {
    console.log("⭐⭐⭐ EMAIL DIALOG PROVIDER - Opening dialog for", lead.name);
    
    // Check if dialog for this lead is already open
    const existingDialogIndex = dialogs.findIndex(dialog => dialog.lead.id === lead.id);
    
    if (existingDialogIndex >= 0) {
      // If it's minimized, un-minimize it
      if (dialogs[existingDialogIndex].minimized) {
        const updatedDialogs = [...dialogs];
        updatedDialogs[existingDialogIndex] = {
          ...updatedDialogs[existingDialogIndex],
          minimized: false,
          isActive: true,
          zIndex: getHighestZIndex()
        };
        
        // Set other dialogs as inactive
        updatedDialogs.forEach((dialog, index) => {
          if (index !== existingDialogIndex) {
            updatedDialogs[index] = { ...dialog, isActive: false };
          }
        });
        
        setDialogs(updatedDialogs);
      } else {
        // Just focus it
        focusDialog(dialogs[existingDialogIndex].id);
      }
      return;
    }
    
    // Create a new dialog with a default position in the center of the screen
    const defaultPosition = {
      x: window.innerWidth / 2 - 400, // Assuming dialog width of ~800px
      y: window.innerHeight / 2 - 300 // Assuming dialog height of ~600px
    };
    
    const newDialog: EmailDialogData = {
      id: uuidv4(),
      lead,
      zIndex: getHighestZIndex(),
      isActive: true,
      minimized: false,
      position: defaultPosition
    };
    
    // Set all other dialogs as inactive
    const updatedDialogs = dialogs.map(dialog => ({
      ...dialog,
      isActive: false
    }));
    
    setDialogs([...updatedDialogs, newDialog]);
  }, [dialogs, getHighestZIndex, focusDialog]);
  
  // Function to close a specific email dialog
  const closeEmailDialog = useCallback((id: string) => {
    console.log("⭐⭐⭐ EMAIL DIALOG PROVIDER - Closing dialog", id);
    
    setDialogs(prevDialogs => {
      const filteredDialogs = prevDialogs.filter(dialog => dialog.id !== id);
      return filteredDialogs;
    });
  }, []);
  
  // Function to minimize/restore a dialog
  const minimizeDialog = useCallback((id: string, minimized: boolean) => {
    console.log(`⭐⭐⭐ EMAIL DIALOG PROVIDER - ${minimized ? 'Minimizing' : 'Restoring'} dialog`, id);
    
    setDialogs(prevDialogs => {
      return prevDialogs.map(dialog => {
        if (dialog.id === id) {
          return { ...dialog, minimized };
        }
        return dialog;
      });
    });
  }, []);
  
  // Function to update a dialog's position
  const updateDialogPosition = useCallback((dialogId: string, position: { x: number; y: number }) => {
    console.log("⭐⭐⭐ EMAIL DIALOG PROVIDER - Updating position for dialog", dialogId, position);
    
    setDialogs(prevDialogs => {
      return prevDialogs.map(dialog => 
        dialog.id === dialogId 
          ? { ...dialog, position } 
          : dialog
      );
    });
  }, []);
  
  // Function to check if a dialog is open
  const isDialogOpen = useCallback((id: string) => {
    return dialogs.some(dialog => dialog.id === id);
  }, [dialogs]);
  
  // Function to get a dialog's z-index
  const getDialogZIndex = useCallback((id: string) => {
    const dialog = dialogs.find(dialog => dialog.id === id);
    return dialog?.zIndex || 50;
  }, [dialogs]);
  
  // Handle successful email
  const handleEmailSuccess = useCallback((emailData: { to: string; subject: string; body: string }, dialogId: string) => {
    console.log("⭐⭐⭐ EMAIL DIALOG PROVIDER - Email sent successfully", emailData);
    
    // Additional logic could be added here (e.g., logging the email to a CRM)
    // Close the dialog after success
    closeEmailDialog(dialogId);
  }, [closeEmailDialog]);
  
  return (
    <EmailDialogContext.Provider
      value={{
        dialogs,
        openEmailDialog,
        closeEmailDialog,
        minimizeDialog,
        focusDialog,
        updateDialogPosition,
        isDialogOpen,
        getDialogZIndex
      }}
    >
      {children}
      
      {/* Render each active dialog */}
      {dialogs
        .filter(dialog => !dialog.minimized)
        .map(dialog => (
          <div 
            key={dialog.id}
            style={{
              position: 'fixed',
              zIndex: dialog.zIndex,
              ...(dialog.position && {
                left: `${dialog.position.x}px`,
                top: `${dialog.position.y}px`
              })
            }}
          >
            <ContextualEmailDialog
              dialogId={dialog.id}
              leadName={dialog.lead.name}
              leadEmail={dialog.lead.email}
              handleClose={() => closeEmailDialog(dialog.id)}
              onSuccess={(emailData) => handleEmailSuccess(emailData, dialog.id)}
            />
          </div>
        ))}
    </EmailDialogContext.Provider>
  );
}

// Custom hook to use the context
export const useEmailDialog = () => useContext(EmailDialogContext); 