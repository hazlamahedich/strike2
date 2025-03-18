'use client';

import React, { useEffect } from 'react';
import { useLeadNotes } from '@/lib/contexts/LeadNotesContext';
import { ContextualLeadNoteDialog } from './ContextualLeadNoteDialog';

export function LeadNoteDialogManager() {
  const { openDialogs, closeDialog, focusDialog } = useLeadNotes();
  
  // Add effect to log when manager is mounted/updated
  useEffect(() => {
    console.log('💬 LeadNoteDialogManager mounted/updated', {
      openDialogsCount: openDialogs?.length || 0,
      openDialogsIds: openDialogs?.map(d => d.id) || [],
    });
    
    return () => {
      console.log('💬 LeadNoteDialogManager unmounted');
    };
  }, [openDialogs]);
  
  // Log current dialogs every render
  console.log('💬 LeadNoteDialogManager rendering', {
    openDialogsCount: openDialogs?.length || 0,
    openDialogsIds: openDialogs?.map(d => d.id) || [],
    openDialogsTypes: openDialogs?.map(d => d.type) || [],
  });
  
  // If no dialogs, render nothing but log this fact
  if (!openDialogs || openDialogs.length === 0) {
    console.log('💬 LeadNoteDialogManager: No dialogs to render');
    return null;
  }
  
  return (
    <>
      {openDialogs.map((dialog) => {
        console.log('💬 LeadNoteDialogManager: Rendering dialog', dialog.id, 'type:', dialog.type);
        
        return (
          <div key={dialog.id} className="lead-note-dialog-wrapper">
            <ContextualLeadNoteDialog
              dialogId={dialog.id}
              lead={dialog.lead}
              note={dialog.note}
              dialogType={dialog.type}
              handleClose={() => {
                console.log('💬 LeadNoteDialogManager: Closing dialog', dialog.id);
                closeDialog(dialog.id);
              }}
              handleNoteSuccess={(note) => {
                console.log('💬 LeadNoteDialogManager: Note saved successfully', dialog.id);
                // Refresh data or perform any necessary actions after successful note save
                closeDialog(dialog.id);
              }}
            />
          </div>
        );
      })}
    </>
  );
} 