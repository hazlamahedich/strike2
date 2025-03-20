'use client';

import React, { useEffect } from 'react';
import { useTaskDialog } from '@/contexts/TaskDialogContext';
import { Button } from '@/components/ui/button';
import { Minimize2, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TaskDialogTaskbar = () => {
  const { dialogs, minimizeDialog, maximizeDialog, closeTaskDialog, focusDialog } = useTaskDialog();
  
  // Filter to only get minimized dialogs
  const minimizedDialogs = dialogs.filter(dialog => dialog.minimized);
  
  // Log when taskbar is rendered
  console.log('🔍🔍 TASKBAR: TaskDialogTaskbar rendering', {
    totalDialogs: dialogs.length,
    minimizedDialogs: minimizedDialogs.length,
    dialogIds: dialogs.map(d => d.id),
    minimizedIds: minimizedDialogs.map(d => d.id)
  });
  
  // Add effect to log when taskbar is mounted/updated
  useEffect(() => {
    console.log('🔍🔍 TASKBAR: TaskDialogTaskbar mounted/updated', {
      totalDialogs: dialogs.length,
      minimizedDialogs: minimizedDialogs.length
    });
    
    return () => {
      console.log('🔍🔍 TASKBAR: TaskDialogTaskbar unmounted');
    };
  }, [dialogs, minimizedDialogs.length]);
  
  if (minimizedDialogs.length === 0) {
    console.log('🔍🔍 TASKBAR: No minimized dialogs to show in taskbar');
    return null;
  }
  
  return (
    <div className={cn(
      "fixed left-0 right-0 z-40 flex h-12 items-center bg-background border-t px-2 space-x-2",
      "bottom-12" // Position above other taskbars if present
    )}>
      <div className="flex-1 flex items-center space-x-2 overflow-x-auto pb-1 pt-1">
        <div className="text-xs text-muted-foreground px-2 flex items-center justify-center">
          Tasks
        </div>
        
        {minimizedDialogs.map((dialog) => {
          // Determine title based on dialog data
          let title = dialog.data?.title || "Task";
          
          // Add lead name if present
          if (dialog.data?.leadName) {
            title = `${title} - ${dialog.data.leadName}`;
          }
          
          console.log('🔍🔍 TASKBAR: Rendering minimized task dialog in taskbar:', {
            id: dialog.id,
            title
          });
          
          return (
            <div 
              key={dialog.id}
              className="flex items-center bg-card hover:bg-accent rounded-md border px-3 py-1 text-sm"
            >
              <button 
                onClick={() => {
                  console.log('🔍🔍 TASKBAR: Restoring minimized dialog:', dialog.id);
                  minimizeDialog(dialog.id, false);
                  setTimeout(() => focusDialog(dialog.id), 50);
                }}
                className="mr-2 flex-1 truncate max-w-[200px] text-left"
              >
                {title}
              </button>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  title="Maximize"
                  onClick={(e) => {
                    e.stopPropagation();
                    minimizeDialog(dialog.id, false);
                    setTimeout(() => {
                      maximizeDialog(dialog.id, true);
                      focusDialog(dialog.id);
                    }, 50);
                  }}
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  title="Close"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('🔍🔍 TASKBAR: Closing minimized dialog:', dialog.id);
                    closeTaskDialog(dialog.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 