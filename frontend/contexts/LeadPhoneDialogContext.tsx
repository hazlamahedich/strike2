'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ContextualLeadPhoneDialog } from '../components/communications/ContextualLeadPhoneDialog';
import { v4 as uuidv4 } from 'uuid';

// Define the types for the Lead data
interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

// Define the context state
interface LeadPhoneDialogContextState {
  isPhoneDialogOpen: boolean;
  currentLead: Lead | null;
  dialogId: string;
  openPhoneDialog: (lead: Lead) => void;
  closePhoneDialog: () => void;
}

// Create the context with default values
const LeadPhoneDialogContext = createContext<LeadPhoneDialogContextState>({
  isPhoneDialogOpen: false,
  currentLead: null,
  dialogId: '',
  openPhoneDialog: () => {},
  closePhoneDialog: () => {},
});

// Create a provider component
export function LeadPhoneDialogProvider({ children }: { children: React.ReactNode }) {
  console.log("⭐⭐⭐ LEAD PHONE DIALOG PROVIDER - Rendering");
  
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [dialogId, setDialogId] = useState('');
  
  // Function to open the phone dialog
  const openPhoneDialog = useCallback((lead: Lead) => {
    console.log("⭐⭐⭐ LEAD PHONE DIALOG PROVIDER - Opening dialog for", lead.name);
    
    setCurrentLead(lead);
    setDialogId(uuidv4()); // Generate a unique ID for the dialog
    setIsPhoneDialogOpen(true);
  }, []);
  
  // Function to close the phone dialog
  const closePhoneDialog = useCallback(() => {
    console.log("⭐⭐⭐ LEAD PHONE DIALOG PROVIDER - Closing dialog");
    
    setIsPhoneDialogOpen(false);
    // We could choose to clear the current lead here, but leaving it
    // allows animating the dialog closed with the last lead info still visible
    // setCurrentLead(null);
  }, []);
  
  // Handle successful call
  const handlePhoneCallSuccess = useCallback((callData: { phoneNumber: string; duration: number; notes: string }) => {
    console.log("⭐⭐⭐ LEAD PHONE DIALOG PROVIDER - Call successful", callData);
    
    // Additional logic could be added here (e.g., logging the call to a CRM)
    // This could be expanded to handle different success scenarios
  }, []);
  
  return (
    <LeadPhoneDialogContext.Provider
      value={{
        isPhoneDialogOpen,
        currentLead,
        dialogId,
        openPhoneDialog,
        closePhoneDialog,
      }}
    >
      {children}
      
      {/* Render phone dialog with proper positioning and dimensions */}
      {isPhoneDialogOpen && currentLead && (
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 9999
        }}>
          <div style={{
            position: 'relative',
            width: '95%',
            maxWidth: '600px',
            maxHeight: '90vh',
            pointerEvents: 'auto',
            margin: '20px'
          }}>
            <ContextualLeadPhoneDialog
              dialogId={dialogId}
              leadName={currentLead.name}
              leadPhone={currentLead.phone}
              handleClose={closePhoneDialog}
              onSuccess={handlePhoneCallSuccess}
            />
          </div>
        </div>
      )}
    </LeadPhoneDialogContext.Provider>
  );
}

// Custom hook to use the context
export const useLeadPhoneDialog = () => useContext(LeadPhoneDialogContext); 