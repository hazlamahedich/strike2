'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { Lead } from '@/lib/types/lead';
import { createLeadNote, getLeadNotes } from '@/lib/api/leads';

export enum LeadNoteDialogType {
  ADD = 'add',
  VIEW = 'view',
  EDIT = 'edit',
}

export interface LeadNoteAttachment {
  id: number;
  note_id: number;
  name: string;
  type: string;
  size: number;
  url: string;
  created_at: string;
}

export interface LeadNote {
  id: number;
  lead_id: number;
  body: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  attachments?: LeadNoteAttachment[];
}

export interface LeadNoteDialogData {
  id: string;
  type: LeadNoteDialogType;
  lead: Lead;
  note?: LeadNote;
  minimized: boolean;
  maximized: boolean;
  active: boolean;
  zIndex: number;
}

export interface ProcessedAttachment {
  name: string;
  type: string;
  size: number;
  data: string;
}

interface LeadNotesContextType {
  openDialogs: LeadNoteDialogData[];
  openAddNoteDialog: (lead: Lead, options?: { maximized?: boolean }) => string;
  openViewNoteDialog: (lead: Lead, noteId: number, options?: { maximized?: boolean }) => Promise<string>;
  closeDialog: (id: string) => void;
  focusDialog: (id: string) => void;
  minimizeDialog: (id: string, minimized: boolean) => void;
  maximizeDialog: (id: string, maximized: boolean) => void;
  setDialogData: <K extends keyof LeadNoteDialogData>(id: string, key: K, value: LeadNoteDialogData[K]) => void;
  saveNote: (leadId: number, noteBody: string, attachments?: ProcessedAttachment[]) => Promise<{ data: any; error: any }>;
  getNotes: (leadId: number) => Promise<{ data: LeadNote[]; error: any }>;
}

const LeadNotesContext = createContext<LeadNotesContextType>({
  openDialogs: [],
  openAddNoteDialog: () => '',
  openViewNoteDialog: async () => '',
  closeDialog: () => {},
  focusDialog: () => {},
  minimizeDialog: () => {},
  maximizeDialog: () => {},
  setDialogData: () => {},
  saveNote: async () => ({ data: null, error: null }),
  getNotes: async () => ({ data: [], error: null }),
});

export const useLeadNotes = () => useContext(LeadNotesContext);

interface LeadNotesProviderProps {
  children: ReactNode;
}

export const LeadNotesProvider: React.FC<LeadNotesProviderProps> = ({ children }) => {
  const [openDialogs, setOpenDialogs] = useState<LeadNoteDialogData[]>([]);
  
  const getHighestZIndex = useCallback(() => {
    if (openDialogs.length === 0) return 100;
    return Math.max(...openDialogs.map(dialog => dialog.zIndex)) + 1;
  }, [openDialogs]);
  
  const openAddNoteDialog = useCallback((lead: Lead, options?: { maximized?: boolean }) => {
    const id = `lead-note-${lead.id}-${Date.now()}`;
    const newZIndex = getHighestZIndex();
    
    const newDialog: LeadNoteDialogData = {
      id,
      type: LeadNoteDialogType.ADD,
      lead,
      minimized: false,
      maximized: options?.maximized || false,
      active: true,
      zIndex: newZIndex,
    };
    
    console.log(`[LeadNotesContext] Opening ADD note dialog: ${id}`);
    
    setOpenDialogs(prevDialogs => {
      // Set all other dialogs to inactive
      const updatedDialogs = prevDialogs.map(dialog => ({
        ...dialog,
        active: false,
      }));
      
      return [...updatedDialogs, newDialog];
    });
    
    return id;
  }, [getHighestZIndex]);
  
  const openViewNoteDialog = useCallback(async (lead: Lead, noteId: number, options?: { maximized?: boolean }) => {
    const id = `lead-note-view-${lead.id}-${noteId}-${Date.now()}`;
    const newZIndex = getHighestZIndex();
    
    try {
      const leadId = typeof lead.id === 'string' ? parseInt(lead.id, 10) : lead.id;
      const { data: notes, error } = await getLeadNotes(leadId);
      
      if (error) {
        toast.error('Error', {
          description: 'Failed to load note',
        });
        return '';
      }
      
      const note = notes.find((n: LeadNote) => n.id === noteId);
      
      if (!note) {
        toast.error('Error', {
          description: 'Note not found',
        });
        return '';
      }
      
      const newDialog: LeadNoteDialogData = {
        id,
        type: LeadNoteDialogType.VIEW,
        lead,
        note,
        minimized: false,
        maximized: options?.maximized || false,
        active: true,
        zIndex: newZIndex,
      };
      
      console.log(`[LeadNotesContext] Opening VIEW note dialog: ${id}`);
      
      setOpenDialogs(prevDialogs => {
        // Set all other dialogs to inactive
        const updatedDialogs = prevDialogs.map(dialog => ({
          ...dialog,
          active: false,
        }));
        
        return [...updatedDialogs, newDialog];
      });
      
      return id;
    } catch (error) {
      console.error('Error loading note:', error);
      toast.error('Error', {
        description: 'Failed to load note',
      });
      return '';
    }
  }, [getHighestZIndex]);
  
  const closeDialog = useCallback((id: string) => {
    console.log(`[LeadNotesContext] Closing dialog: ${id}`);
    
    setOpenDialogs(prevDialogs => {
      const dialogIndex = prevDialogs.findIndex(dialog => dialog.id === id);
      
      if (dialogIndex === -1) {
        console.warn(`[LeadNotesContext] Cannot close dialog ${id}: dialog not found`);
        return prevDialogs;
      }
      
      const newDialogs = [...prevDialogs];
      newDialogs.splice(dialogIndex, 1);
      
      // If there are remaining dialogs, set the last one as active
      if (newDialogs.length > 0) {
        // Find the highest z-index dialog that is not minimized
        const visibleDialogs = newDialogs.filter(dialog => !dialog.minimized);
        
        if (visibleDialogs.length > 0) {
          const highestZIndexDialog = visibleDialogs.reduce((highest, current) => 
            current.zIndex > highest.zIndex ? current : highest
          );
          
          return newDialogs.map(dialog => ({
            ...dialog,
            active: dialog.id === highestZIndexDialog.id,
          }));
        }
      }
      
      return newDialogs;
    });
  }, []);
  
  const focusDialog = useCallback((dialogId: string) => {
    console.log(`[LeadNotesContext] Focusing dialog: ${dialogId}`);
    
    setOpenDialogs(prevDialogs => {
      const dialogIndex = prevDialogs.findIndex(dialog => dialog.id === dialogId);
      
      if (dialogIndex === -1) {
        console.warn(`[LeadNotesContext] Cannot focus dialog ${dialogId}: dialog not found`);
        return prevDialogs;
      }
      
      const dialog = prevDialogs[dialogIndex];
      
      if (dialog.active && !dialog.minimized) {
        console.log(`[LeadNotesContext] Dialog ${dialogId} is already active and not minimized`);
        return prevDialogs;
      }
      
      const newZIndex = getHighestZIndex();
      const currentMinimized = dialog.minimized;
      
      const updatedDialogs = prevDialogs.map((d, index) => {
        if (index === dialogIndex) {
          return {
            ...d,
            active: true,
            minimized: false,
            zIndex: newZIndex,
          };
        } else {
          return {
            ...d,
            active: false,
          };
        }
      });
      
      console.log(`[LeadNotesContext] Dialog ${dialogId} set to active, minimized=${currentMinimized}, z-index ${newZIndex}`);
      
      return updatedDialogs;
    });
  }, [getHighestZIndex]);
  
  const minimizeDialog = useCallback((id: string, minimized: boolean) => {
    console.log(`[LeadNotesContext] ${minimized ? 'Minimizing' : 'Restoring'} dialog: ${id}`);
    
    setOpenDialogs(prevDialogs => {
      const dialogIndex = prevDialogs.findIndex(dialog => dialog.id === id);
      
      if (dialogIndex === -1) {
        console.log(`[LeadNotesContext] Cannot minimize dialog ${id}: dialog not found`);
        return prevDialogs;
      }
      
      console.log(`[LeadNotesContext] Updating dialog ${id} at index ${dialogIndex}, setting minimized=${minimized}`);
      
      const updatedDialogs = prevDialogs.map((dialog, index) => {
        if (index === dialogIndex) {
          return {
            ...dialog,
            minimized,
            active: !minimized,
          };
        }
        return dialog;
      });
      
      // If restoring from minimized, make this dialog active and others inactive
      if (!minimized) {
        const newZIndex = getHighestZIndex();
        
        return updatedDialogs.map((dialog, index) => {
          if (index === dialogIndex) {
            return {
              ...dialog,
              active: true,
              zIndex: newZIndex,
            };
          } else {
            return {
              ...dialog,
              active: false,
            };
          }
        });
      }
      
      return updatedDialogs;
    });
  }, [getHighestZIndex]);
  
  const maximizeDialog = useCallback((id: string, maximized: boolean) => {
    console.log(`[LeadNotesContext] ${maximized ? 'Maximizing' : 'Restoring'} dialog: ${id}`);
    
    setOpenDialogs(prevDialogs => {
      const dialogIndex = prevDialogs.findIndex(dialog => dialog.id === id);
      
      if (dialogIndex === -1) {
        console.error(`[LeadNotesContext] Dialog ${id} not found in state during maximization`);
        return prevDialogs;
      }
      
      // Update the dialog's maximized state
      const updatedDialogs = prevDialogs.map((dialog, index) => {
        if (index === dialogIndex) {
          return {
            ...dialog,
            maximized,
            active: true,
          };
        } else {
          return {
            ...dialog,
            active: false,
          };
        }
      });
      
      return updatedDialogs;
    });
  }, []);
  
  const setDialogData = useCallback(<K extends keyof LeadNoteDialogData>(
    id: string,
    key: K,
    value: LeadNoteDialogData[K]
  ) => {
    setOpenDialogs(prevDialogs => {
      const dialogIndex = prevDialogs.findIndex(dialog => dialog.id === id);
      
      if (dialogIndex === -1) return prevDialogs;
      
      const updatedDialogs = [...prevDialogs];
      updatedDialogs[dialogIndex] = {
        ...updatedDialogs[dialogIndex],
        [key]: value,
      };
      
      return updatedDialogs;
    });
  }, []);
  
  const saveNote = useCallback(async (leadId: number, noteBody: string, attachments?: ProcessedAttachment[]) => {
    try {
      // Create data structure with note content and attachments
      const noteData = {
        content: noteBody,
        attachments: attachments || []
      };
      
      // Make API call to save the note
      const response = await createLeadNote(leadId, noteData);
      
      // Log successful note creation with stats
      if (!response.error) {
        console.log(`Successfully saved note for lead ${leadId} ${attachments?.length ? `with ${attachments.length} attachments` : ''}`);
      }
      
      return response;
    } catch (error) {
      console.error('Error saving note:', error);
      return {
        data: null,
        error: 'Failed to save note',
      };
    }
  }, []);
  
  const getNotes = useCallback(async (leadId: number) => {
    try {
      return await getLeadNotes(leadId);
    } catch (error) {
      console.error('Error fetching lead notes:', error);
      return {
        data: [],
        error: 'Failed to fetch notes',
      };
    }
  }, []);
  
  const contextValue: LeadNotesContextType = {
    openDialogs,
    openAddNoteDialog,
    openViewNoteDialog,
    closeDialog,
    focusDialog,
    minimizeDialog,
    maximizeDialog,
    setDialogData,
    saveNote,
    getNotes,
  };
  
  return (
    <LeadNotesContext.Provider value={contextValue}>
      {children}
    </LeadNotesContext.Provider>
  );
}; 