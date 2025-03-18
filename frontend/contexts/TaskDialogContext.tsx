'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Define task dialog types
export enum TaskDialogType {
  ADD = 'add',
  EDIT = 'edit',
  VIEW = 'view',
  DELETE = 'delete'
}

// Define dialog data structure
export interface TaskDialogData {
  id: string;
  type: TaskDialogType;
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
interface TaskDialogContextType {
  dialogs: TaskDialogData[];
  openTaskDialog: (
    id: string, 
    type: TaskDialogType, 
    content: React.ReactNode, 
    data?: Record<string, any>
  ) => boolean;
  closeTaskDialog: (id: string) => boolean;
  focusDialog: (id: string) => void;
  minimizeDialog: (id: string, minimized: boolean) => void;
  maximizeDialog: (id: string, maximized: boolean) => void;
  isDialogOpen: (id: string) => boolean;
  getDialogZIndex: (id: string) => number;
  getDialogData: (id: string) => TaskDialogData | undefined;
  getAllDialogs: () => TaskDialogData[];
  setDialogs: React.Dispatch<React.SetStateAction<TaskDialogData[]>>;
}

// Create context with default values
const TaskDialogContext = createContext<TaskDialogContextType>({
  dialogs: [],
  openTaskDialog: () => false,
  closeTaskDialog: () => false,
  focusDialog: () => {},
  minimizeDialog: () => {},
  maximizeDialog: () => {},
  isDialogOpen: () => false,
  getDialogZIndex: () => 50,
  getDialogData: () => undefined,
  getAllDialogs: () => [],
  setDialogs: () => {},
});

// Hook to use task dialog context
export const useTaskDialog = () => useContext(TaskDialogContext);

// Base Z-index for dialogs
const BASE_Z_INDEX = 50;

// Provider component
interface TaskDialogProviderProps {
  children: ReactNode;
}

export const TaskDialogProvider = ({ children }: TaskDialogProviderProps) => {
  const [dialogs, setDialogs] = useState<TaskDialogData[]>([]);
  const [highestZIndex, setHighestZIndex] = useState(BASE_Z_INDEX);

  // Open a new task dialog
  const openTaskDialog = useCallback((
    id: string, 
    type: TaskDialogType, 
    content: React.ReactNode, 
    data?: Record<string, any>
  ) => {
    // Check for invalid input
    if (!id || !content) {
      console.error('Cannot open dialog - missing id or content');
      return false;
    }
    
    setDialogs(prevDialogs => {
      // Check if dialog already exists
      const existingIndex = prevDialogs.findIndex(d => d.id === id);
      
      // Set all dialogs to inactive
      const inactiveDialogs = prevDialogs.map(d => ({
        ...d,
        isActive: false
      }));
      
      // Calculate position (center of screen with slight offset)
      const position = {
        x: window.innerWidth / 2 - 300,
        y: window.innerHeight / 2 - 200
      };
      
      // Create the new dialog
      const newDialog: TaskDialogData = {
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
      
      // If dialog already exists, update it; otherwise add it
      let newDialogs;
      if (existingIndex >= 0) {
        newDialogs = [...inactiveDialogs];
        newDialogs[existingIndex] = newDialog;
      } else {
        newDialogs = [...inactiveDialogs, newDialog];
      }
      
      // Update highest z-index
      setHighestZIndex(prev => prev + 1);
      
      return newDialogs;
    });
    
    // Return true to indicate the dialog was opened
    return true;
  }, [highestZIndex]);

  // Close a task dialog
  const closeTaskDialog = useCallback((id: string) => {
    setDialogs(prevDialogs => prevDialogs.filter(dialog => dialog.id !== id));
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
          if (!maximized && dialog.maximized) {
            return {
              ...dialog,
              maximized,
              position: dialog.previousPosition,
              size: dialog.previousSize
            };
          }
          return { ...dialog, maximized };
        }
        return dialog;
      });
    });
  }, []);

  // Check if a dialog is open
  const isDialogOpen = useCallback((id: string) => {
    return dialogs.some(dialog => dialog.id === id);
  }, [dialogs]);

  // Get z-index for a dialog
  const getDialogZIndex = useCallback((id: string) => {
    const dialog = dialogs.find(dialog => dialog.id === id);
    return dialog?.zIndex || BASE_Z_INDEX;
  }, [dialogs]);

  // Get dialog data
  const getDialogData = useCallback((id: string) => {
    return dialogs.find(dialog => dialog.id === id);
  }, [dialogs]);

  // Get all dialogs
  const getAllDialogs = useCallback(() => {
    return dialogs;
  }, [dialogs]);

  return (
    <TaskDialogContext.Provider value={{
      dialogs,
      openTaskDialog,
      closeTaskDialog,
      focusDialog,
      minimizeDialog,
      maximizeDialog,
      isDialogOpen,
      getDialogZIndex,
      getDialogData,
      getAllDialogs,
      setDialogs
    }}>
      {children}
      <TaskDialogContainer />
    </TaskDialogContext.Provider>
  );
};

// Dialog container component that renders active dialogs
export const TaskDialogContainer = () => {
  const { dialogs } = useTaskDialog();
  const [mounted, setMounted] = useState(false);
  
  // Client-side only
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Apply dialog offsets
  const processedDialogs = dialogs.map((dialog, index) => {
    if (dialog.position && index > 0 && !dialog.maximized && !dialog.minimized) {
      return {
        ...dialog,
        position: {
          x: (typeof dialog.position.x === 'number' ? dialog.position.x : 100) + (index * 30),
          y: (typeof dialog.position.y === 'number' ? dialog.position.y : 100) + (index * 30)
        }
      };
    }
    return dialog;
  });
  
  // Use portal to render at document root
  if (!mounted) return null;
  
  return createPortal(
    <div className="task-dialog-container" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9000 }}>
      {processedDialogs.map((dialog) => (
        <React.Fragment key={dialog.id}>
          {dialog.content}
        </React.Fragment>
      ))}
    </div>,
    document.body
  );
}; 