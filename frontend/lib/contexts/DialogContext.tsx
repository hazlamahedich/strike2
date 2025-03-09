'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of our dialog state
interface DialogState {
  [dialogId: string]: boolean;
}

// Define the context shape
interface DialogContextType {
  dialogState: DialogState;
  openDialog: (dialogId: string) => void;
  closeDialog: (dialogId: string) => void;
  toggleDialog: (dialogId: string) => void;
  isDialogOpen: (dialogId: string) => boolean;
}

// Create the context with default values
const DialogContext = createContext<DialogContextType>({
  dialogState: {},
  openDialog: () => {},
  closeDialog: () => {},
  toggleDialog: () => {},
  isDialogOpen: () => false,
});

// Custom hook to use the dialog context
export const useDialog = () => useContext(DialogContext);

// Provider component
interface DialogProviderProps {
  children: ReactNode;
}

export const DialogProvider = ({ children }: DialogProviderProps) => {
  const [dialogState, setDialogState] = useState<DialogState>({});

  const openDialog = (dialogId: string) => {
    setDialogState((prev) => ({
      ...prev,
      [dialogId]: true,
    }));
  };

  const closeDialog = (dialogId: string) => {
    setDialogState((prev) => ({
      ...prev,
      [dialogId]: false,
    }));
  };

  const toggleDialog = (dialogId: string) => {
    setDialogState((prev) => ({
      ...prev,
      [dialogId]: !prev[dialogId],
    }));
  };

  const isDialogOpen = (dialogId: string) => {
    return !!dialogState[dialogId];
  };

  return (
    <DialogContext.Provider
      value={{
        dialogState,
        openDialog,
        closeDialog,
        toggleDialog,
        isDialogOpen,
      }}
    >
      {children}
    </DialogContext.Provider>
  );
}; 