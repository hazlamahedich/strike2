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
export const useTaskDialog = () => {
  const context = useContext(TaskDialogContext);
  
  // For debugging - add a unique identifier if not already present
  if (context && !context.hasOwnProperty('__contextId')) {
    // Use a timestamp to ensure unique ID
    Object.defineProperty(context, '__contextId', {
      value: `provider-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      enumerable: true,
    });
    console.log("⭐⭐⭐ TASK DIALOG HOOK - Created context with ID:", (context as any).__contextId);
  } else if (context) {
    console.log("⭐⭐⭐ TASK DIALOG HOOK - Using existing context ID:", (context as any).__contextId);
  }
  
  return context;
};

// Hook to check if the TaskDialogContext already has a provider
export const hasTaskDialogProvider = () => {
  const context = useContext(TaskDialogContext);
  // Check if any of the context methods are the defaults (indicating no provider)
  return context.openTaskDialog !== (() => false);
};

// Base Z-index for dialogs
const BASE_Z_INDEX = 50;

// Provider component
interface TaskDialogProviderProps {
  children: ReactNode;
}

export const TaskDialogProvider = ({ children }: TaskDialogProviderProps) => {
  const [dialogs, setDialogs] = useState<TaskDialogData[]>([]);
  const [highestZIndex, setHighestZIndex] = useState(BASE_Z_INDEX);
  const [showDebug, setShowDebug] = useState(false);

  // Add debug toggle with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle debug view with Alt+D
      if (e.altKey && e.key === 'd') {
        setShowDebug(prev => !prev);
        console.log("⭐⭐⭐ TASK DIALOG PROVIDER - Debug view toggled:", !showDebug);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDebug]);

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
    
    console.log("⭐⭐⭐ TASK DIALOG PROVIDER - openTaskDialog called with:", { 
      id, 
      type, 
      contentType: typeof content === 'object' && content !== null ? 
        (content as any)?.type?.name || 'React Element' : 
        typeof content,
      hasContent: !!content 
    });
    
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
      
      {/* Debug overlay - toggle with Alt+D */}
      {showDebug && (
        <div 
          style={{
            position: 'fixed',
            bottom: 10,
            right: 10,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: 10,
            borderRadius: 5,
            zIndex: 10000,
            maxWidth: 300,
            maxHeight: 300,
            overflow: 'auto',
            fontSize: 12,
          }}
        >
          <h4>TaskDialog Debug</h4>
          <p>Active Dialogs: {dialogs.length}</p>
          <ul>
            {dialogs.map(d => (
              <li key={d.id}>
                {d.id} ({d.type}) - z:{d.zIndex}
              </li>
            ))}
          </ul>
          <button 
            onClick={() => setShowDebug(false)}
            style={{
              background: '#333',
              border: 'none',
              color: 'white',
              padding: '2px 5px',
              borderRadius: 3,
              marginTop: 5
            }}
          >
            Close
          </button>
        </div>
      )}
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
    console.log("⭐⭐⭐ TASK DIALOG CONTAINER - Mounted with dialogs:", dialogs.length);
    return () => setMounted(false);
  }, [dialogs.length]);
  
  // Log when dialogs change
  useEffect(() => {
    console.log("⭐⭐⭐ TASK DIALOG CONTAINER - Dialogs updated:", dialogs);
  }, [dialogs]);
  
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
  
  console.log("⭐⭐⭐ TASK DIALOG CONTAINER - Rendering", processedDialogs.length, "dialogs");
  
  return createPortal(
    <div className="task-dialog-container" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9000 }}>
      {processedDialogs.map((dialog) => {
        console.log("⭐⭐⭐ TASK DIALOG CONTAINER - Rendering dialog:", dialog.id);
        return (
          <React.Fragment key={dialog.id}>
            {dialog.content}
          </React.Fragment>
        );
      })}
    </div>,
    document.body
  );
};

// Emergency global fallback for task dialogs - escape hatch for context issues
let _safeTaskDialogs: TaskDialogData[] = [];
let _dialogUpdateListeners: Array<() => void> = [];

export const safeOpenTaskDialog = (
  id: string, 
  type: TaskDialogType, 
  content: React.ReactNode
): boolean => {
  console.log("⭐⭐⭐ SAFE TASK DIALOG - Emergency fallback called");
  const dialog: TaskDialogData = {
    id,
    type,
    content,
    zIndex: 9999,
    isActive: true
  };
  
  _safeTaskDialogs = [..._safeTaskDialogs, dialog];
  _dialogUpdateListeners.forEach(listener => listener());
  
  // Check if we need to create the emergency container
  let container = document.querySelector('.emergency-task-dialog-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'emergency-task-dialog-container';
    (container as HTMLDivElement).style.position = 'fixed';
    (container as HTMLDivElement).style.inset = '0';
    (container as HTMLDivElement).style.pointerEvents = 'none';
    (container as HTMLDivElement).style.zIndex = '9999';
    document.body.appendChild(container);
  }
  
  // Use createRoot to render the dialog
  const dialogRoot = document.createElement('div');
  dialogRoot.id = `emergency-dialog-${id}`;
  container.appendChild(dialogRoot);
  
  // Render the dialog content
  // This needs React 18's createRoot but we'll just log for now
  console.log("⭐⭐⭐ SAFE TASK DIALOG - Would render content to emergency container");
  
  return true;
};

// Export for the ContextualRescheduleDialog.tsx file
export const getEmergencyTaskDialogs = () => _safeTaskDialogs;

// Subscribe to dialog updates
export const subscribeToDialogUpdates = (callback: () => void) => {
  _dialogUpdateListeners.push(callback);
  return () => {
    _dialogUpdateListeners = _dialogUpdateListeners.filter(cb => cb !== callback);
  };
}; 