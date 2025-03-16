'use client';

import React, { useEffect } from 'react';
import { useMeetingDialog, MeetingDialogType } from '@/contexts/MeetingDialogContext';
import { Button } from '@/components/ui/button';
import { Minimize2, Maximize2, X } from 'lucide-react';

export const MeetingDialogTaskbar = () => {
  const { dialogs, minimizeDialog, closeMeetingDialog } = useMeetingDialog();
  
  // Filter to only get minimized dialogs
  const minimizedDialogs = dialogs.filter(dialog => dialog.minimized);
  
  // Log when taskbar is rendered
  console.log('🔍🔍 TASKBAR: MeetingDialogTaskbar rendering', {
    totalDialogs: dialogs.length,
    minimizedDialogs: minimizedDialogs.length,
    dialogIds: dialogs.map(d => d.id),
    minimizedIds: minimizedDialogs.map(d => d.id)
  });
  
  // Add effect to log when taskbar is mounted/updated
  useEffect(() => {
    console.log('🔍🔍 TASKBAR: MeetingDialogTaskbar mounted/updated', {
      totalDialogs: dialogs.length,
      minimizedDialogs: minimizedDialogs.length
    });
    
    return () => {
      console.log('🔍🔍 TASKBAR: MeetingDialogTaskbar unmounted');
    };
  }, [dialogs, minimizedDialogs.length]);
  
  if (minimizedDialogs.length === 0) {
    console.log('🔍🔍 TASKBAR: No minimized dialogs to show in taskbar');
    return null;
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-12 items-center bg-background border-t px-2 space-x-2">
      {minimizedDialogs.map((dialog) => {
        // Determine title based on dialog data
        let title = "Dialog";
        
        if (dialog.data?.meeting?.title) {
          title = dialog.data.meeting.title;
        } else if (dialog.type === MeetingDialogType.DETAILS) {
          title = "Meeting Details";
        } else if (dialog.type === MeetingDialogType.SCHEDULE) {
          title = "Schedule Meeting";
        } else if (dialog.type === MeetingDialogType.EDIT) {
          title = "Edit Meeting";
        }
        
        console.log('🔍🔍 TASKBAR: Rendering minimized dialog in taskbar:', {
          id: dialog.id,
          title,
          type: dialog.type
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
              }}
              className="mr-2 flex-1 truncate max-w-[200px] text-left"
            >
              {title}
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => {
                console.log('🔍🔍 TASKBAR: Closing minimized dialog:', dialog.id);
                closeMeetingDialog(dialog.id);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}; 