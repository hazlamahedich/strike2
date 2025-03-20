"use client"

import React, { createContext, useContext, ReactNode } from 'react';

interface DialogProviderProps {
  children: ReactNode;
}

const DialogContext = createContext<any>(null);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}

export function DialogProvider({ children }: DialogProviderProps) {
  return (
    <DialogContext.Provider value={{}}>
      {children}
    </DialogContext.Provider>
  );
} 