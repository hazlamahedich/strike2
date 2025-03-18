'use client';

import React from 'react';
import { useLeadNotes } from '@/lib/contexts/LeadNotesContext';
import { ContextualLeadNoteDialog } from './ContextualLeadNoteDialog';

export function LeadNoteDialogManager() {
  const { openDialogs, closeDialog, focusDialog } = useLeadNotes();
  
  return (
    <>
      {openDialogs.map((dialog) => (
        <div key={dialog.id}>
          <ContextualLeadNoteDialog
            dialogId={dialog.id}
            lead={dialog.lead}
            note={dialog.note}
            dialogType={dialog.type}
            handleClose={() => closeDialog(dialog.id)}
            handleNoteSuccess={() => {
              // Refresh data or perform any necessary actions after successful note save
              closeDialog(dialog.id);
            }}
          />
        </div>
      ))}
    </>
  );
} 