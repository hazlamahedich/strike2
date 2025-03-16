'use client';

import React from 'react';
import { useMeetingDialog, MeetingDialogType } from '@/lib/contexts/MeetingDialogContext';
import { cn } from '@/lib/utils';
import { Minimize2, Maximize2, X, LayoutGrid, Layers } from 'lucide-react';

export function MeetingDialogTaskbar() {
  const { 
    getAllMeetingDialogs,
    focusMeetingDialog,
    closeMeetingDialog,
    minimizeMeetingDialog,
    maximizeMeetingDialog,
    arrangeDialogsCascade,
    arrangeDialogsTile
  } = useMeetingDialog();
  
  const openDialogs = getAllMeetingDialogs();
  
  // No taskbar if no dialogs are open
  if (openDialogs.length === 0) {
    return null;
  }
  
  // Determine dialog title based on type and data
  const getDialogTitle = (dialogType: MeetingDialogType, meeting?: any) => {
    switch (dialogType) {
      case MeetingDialogType.DETAILS:
        return meeting?.title || 'Meeting Details';
      case MeetingDialogType.SCHEDULE:
        return 'Schedule Meeting';
      case MeetingDialogType.EDIT:
        return 'Edit Meeting';
      case MeetingDialogType.RESCHEDULE:
        return 'Reschedule Meeting';
      case MeetingDialogType.CANCEL:
        return 'Cancel Meeting';
      case MeetingDialogType.SUMMARY:
        return 'Meeting Summary';
      case MeetingDialogType.COMPREHENSIVE_SUMMARY:
        return 'Comprehensive Summary';
      default:
        return 'Meeting Dialog';
    }
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border h-12 flex items-center px-4 z-50">
      <div className="flex-grow-0 mr-4">
        {openDialogs.length > 1 && (
          <div className="flex items-center space-x-2">
            <button
              className="flex items-center px-2 py-1 text-xs rounded border border-border hover:bg-secondary"
              onClick={arrangeDialogsCascade}
              title="Cascade Windows"
            >
              <Layers className="h-3 w-3 mr-1" />
              <span>Cascade</span>
            </button>
            <button
              className="flex items-center px-2 py-1 text-xs rounded border border-border hover:bg-secondary"
              onClick={arrangeDialogsTile}
              title="Tile Windows"
            >
              <LayoutGrid className="h-3 w-3 mr-1" />
              <span>Tile</span>
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto flex-grow">
        {openDialogs.map((dialog) => (
          <div
            key={dialog.id}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-md cursor-pointer transition-colors",
              dialog.isActive
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
            onClick={() => {
              console.log('🔼 Taskbar item clicked', { dialogId: dialog.id, minimized: dialog.minimized });
              // If dialog is minimized, restore it first
              if (dialog.minimized) {
                console.log('🔼 Restoring minimized dialog from taskbar', { dialogId: dialog.id });
                minimizeMeetingDialog(dialog.id, false);
                // Wait a short time before focusing to avoid state conflicts
                setTimeout(() => {
                  console.log('🔼 Now focusing restored dialog', { dialogId: dialog.id });
                  focusMeetingDialog(dialog.id);
                }, 50);
              } else {
                // If not minimized, just focus
                focusMeetingDialog(dialog.id);
              }
            }}
          >
            <span className="text-sm truncate max-w-[150px]">
              {getDialogTitle(dialog.type, dialog.meeting)}
            </span>
            
            <div className="flex items-center ml-2">
              <button
                className="rounded-full h-5 w-5 inline-flex items-center justify-center hover:bg-primary-foreground/20"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('🔽 Taskbar minimize button clicked', { 
                    dialogId: dialog.id, 
                    currentlyMinimized: dialog.minimized, 
                    newMinimizedState: !dialog.minimized 
                  });
                  minimizeMeetingDialog(dialog.id, !dialog.minimized);
                  console.log('🔽 After taskbar minimize call', { dialogId: dialog.id });
                }}
                title={dialog.minimized ? "Restore" : "Minimize"}
              >
                <Minimize2 className="h-3 w-3" />
              </button>
              
              <button
                className="rounded-full h-5 w-5 inline-flex items-center justify-center hover:bg-primary-foreground/20 ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  maximizeMeetingDialog(dialog.id, !dialog.maximized);
                }}
                title={dialog.maximized ? "Restore" : "Maximize"}
              >
                <Maximize2 className="h-3 w-3" />
              </button>
              
              <button
                className="rounded-full h-5 w-5 inline-flex items-center justify-center hover:bg-primary-foreground/20 ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  closeMeetingDialog(dialog.id);
                }}
                title="Close"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 