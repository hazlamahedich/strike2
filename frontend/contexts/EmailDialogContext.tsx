'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ContextualEmailDialog } from '../components/communications/ContextualEmailDialog';
import { v4 as uuidv4 } from 'uuid';

// Define the types for the Lead data
interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

// Define the context state
interface EmailDialogContextState {
  isEmailDialogOpen: boolean;
  currentLead: Lead | null;
  dialogId: string;
  openEmailDialog: (lead: Lead) => void;
  closeEmailDialog: () => void;
}

// Create the context with default values
const EmailDialogContext = createContext<EmailDialogContextState>({
  isEmailDialogOpen: false,
  currentLead: null,
  dialogId: '',
  openEmailDialog: () => {},
  closeEmailDialog: () => {},
});

// Create a provider component
export function EmailDialogProvider({ children }: { children: React.ReactNode }) {
  console.log("⭐⭐⭐ EMAIL DIALOG PROVIDER - Rendering");
  
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [dialogId, setDialogId] = useState('');
  
  // Function to open the email dialog
  const openEmailDialog = useCallback((lead: Lead) => {
    console.log("⭐⭐⭐ EMAIL DIALOG PROVIDER - Opening dialog for", lead.name);
    
    setCurrentLead(lead);
    setDialogId(uuidv4()); // Generate a unique ID for the dialog
    setIsEmailDialogOpen(true);
  }, []);
  
  // Function to close the email dialog
  const closeEmailDialog = useCallback(() => {
    console.log("⭐⭐⭐ EMAIL DIALOG PROVIDER - Closing dialog");
    
    setIsEmailDialogOpen(false);
    // We could choose to clear the current lead here, but leaving it
    // allows animating the dialog closed with the last lead info still visible
    // setCurrentLead(null);
  }, []);
  
  // Handle successful email
  const handleEmailSuccess = useCallback((emailData: { to: string; subject: string; body: string }) => {
    console.log("⭐⭐⭐ EMAIL DIALOG PROVIDER - Email sent successfully", emailData);
    
    // Additional logic could be added here (e.g., logging the email to a CRM)
    // This could be expanded to handle different success scenarios
  }, []);
  
  return (
    <EmailDialogContext.Provider
      value={{
        isEmailDialogOpen,
        currentLead,
        dialogId,
        openEmailDialog,
        closeEmailDialog,
      }}
    >
      {children}
      
      {/* Add an overlay when the email dialog is open to ensure visibility */}
      {isEmailDialogOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9990,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {currentLead && (
            <div style={{ zIndex: 9999, position: 'relative' }}>
              <ContextualEmailDialog
                dialogId={dialogId}
                leadName={currentLead.name}
                leadEmail={currentLead.email}
                handleClose={closeEmailDialog}
                onSuccess={handleEmailSuccess}
              />
            </div>
          )}
        </div>
      )}
    </EmailDialogContext.Provider>
  );
}

// Custom hook to use the context
export const useEmailDialog = () => useContext(EmailDialogContext); 