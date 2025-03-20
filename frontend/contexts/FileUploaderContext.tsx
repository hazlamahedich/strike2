"use client"

import React, { createContext, useContext, ReactNode } from 'react';

interface FileUploaderProviderProps {
  children: ReactNode;
}

const FileUploaderContext = createContext<any>(null);

export function useFileUploader() {
  const context = useContext(FileUploaderContext);
  if (!context) {
    throw new Error("useFileUploader must be used within a FileUploaderProvider");
  }
  return context;
}

export function FileUploaderProvider({ children }: FileUploaderProviderProps) {
  return (
    <FileUploaderContext.Provider value={{}}>
      {children}
    </FileUploaderContext.Provider>
  );
} 