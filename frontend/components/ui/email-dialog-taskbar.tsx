'use client';

import React, { useCallback } from 'react';
import { useEmailDialog } from '@/contexts/EmailDialogContext';
import { UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export const EmailDialogTaskbar = () => {
  const { dialogs, minimizeDialog, focusDialog, closeEmailDialog } = useEmailDialog();
  
  // Filter only minimized dialogs
  const minimizedDialogs = dialogs.filter(dialog => dialog.minimized);
  
  console.log("📧 EMAIL DIALOG TASKBAR - Rendering with", minimizedDialogs.length, "minimized dialogs");
  
  // Handle maximizing (restoring) a dialog
  const handleRestore = useCallback((id: string) => {
    console.log("📧 EMAIL DIALOG TASKBAR - Restoring dialog", id);
    minimizeDialog(id, false);
    focusDialog(id);
  }, [minimizeDialog, focusDialog]);
  
  // Handle closing a dialog
  const handleClose = useCallback((id: string) => {
    console.log("📧 EMAIL DIALOG TASKBAR - Closing dialog", id);
    closeEmailDialog(id);
  }, [closeEmailDialog]);
  
  // If no minimized dialogs, don't render the taskbar
  if (minimizedDialogs.length === 0) {
    return null;
  }
  
  return (
    <div 
      className="fixed bottom-0 left-0 z-50 h-12 flex items-center space-x-2 px-4 bg-background border-t border-border dark:border-border/40"
      style={{ width: 'auto' }}
    >
      {minimizedDialogs.map(dialog => (
        <div
          key={dialog.id}
          className={cn(
            "flex items-center px-3 py-1 rounded-md cursor-pointer bg-background hover:bg-accent dark:hover:bg-accent/30 border border-border dark:border-border/40",
            "transition-colors duration-200 max-w-[200px]"
          )}
          onClick={() => handleRestore(dialog.id)}
        >
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="h-6 w-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary-foreground flex-shrink-0">
              <UserIcon size={14} />
            </div>
            <div className="truncate text-sm">
              <span className="truncate">
                {dialog.lead.name || 'Email Dialog'}
              </span>
            </div>
          </div>
          <button
            className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              handleClose(dialog.id);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default EmailDialogTaskbar; 