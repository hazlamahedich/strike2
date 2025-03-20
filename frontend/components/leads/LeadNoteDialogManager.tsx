'use client';

import React, { useEffect } from 'react';
import { useLeadNotes } from '@/lib/contexts/LeadNotesContext';
import { ContextualLeadNoteDialog } from './ContextualLeadNoteDialog';
import { Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LeadNoteDialogManager() {
  const { openDialogs, closeDialog, focusDialog, minimizeDialog } = useLeadNotes();
  
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
  
  const visibleDialogs = openDialogs.filter(dialog => !dialog.minimized);
  const minimizedDialogs = openDialogs.filter(dialog => dialog.minimized);
  
  const handleRestoreDialog = (dialogId: string) => {
    console.log('💬 LeadNoteDialogManager: Restoring dialog', dialogId);
    minimizeDialog(dialogId, false); // Un-minimize the dialog
    focusDialog(dialogId); // Also focus it to bring it to the front
  };
  
  return (
    <>
      {/* Active dialogs container */}
      <div className="lead-note-dialog-container fixed inset-0 pointer-events-none z-50">
        {visibleDialogs.map((dialog) => {
          console.log('💬 LeadNoteDialogManager: Rendering dialog', dialog.id, 'type:', dialog.type);
          
          return (
            <div 
              key={dialog.id} 
              className="lead-note-dialog-wrapper pointer-events-auto"
              data-lead-note-dialog-id={dialog.id}
              style={{
                position: 'absolute',
                top: '10%',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: dialog.zIndex || 50
              }}
            >
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
      </div>
      
      {/* Minimized dialogs bar at the bottom */}
      {minimizedDialogs.length > 0 && (
        <div 
          className="fixed bottom-0 left-0 right-0 flex items-center justify-start p-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50"
        >
          <div className="flex gap-2 overflow-x-auto">
            {minimizedDialogs.map((dialog) => (
              <button
                key={dialog.id}
                onClick={() => handleRestoreDialog(dialog.id)}
                className={cn(
                  "flex items-center gap-2 py-1 px-3 rounded-md text-sm",
                  "bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600",
                  "border border-gray-300 dark:border-gray-600",
                  "shadow-sm transition-colors duration-200"
                )}
              >
                <Maximize className="h-3 w-3" />
                <span className="truncate max-w-[120px]">
                  {dialog.type === 'add' ? 'Note for' : 'View Note'}: {' '}
                  {(dialog.lead as any).first_name && (dialog.lead as any).last_name
                    ? `${(dialog.lead as any).first_name} ${(dialog.lead as any).last_name}`
                    : dialog.lead?.name || `Lead #${dialog.lead?.id}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
} 