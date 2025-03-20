'use client';

import { useLeadPhoneDialog } from '@/contexts/LeadPhoneDialogContext';
import { Phone } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export function PhoneDialogTaskbar() {
  const { dialogs, minimizeDialog, focusDialog, closePhoneDialog } = useLeadPhoneDialog();
  
  // Filter out only minimized dialogs
  const minimizedDialogs = dialogs.filter(dialog => dialog.minimized);
  
  console.log("🔔 PHONE DIALOG TASKBAR - Rendering with minimized dialogs:", minimizedDialogs.length);
  
  if (minimizedDialogs.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed bottom-24 right-0 flex flex-col items-end z-50 p-2 pointer-events-none max-h-[calc(100vh-6rem)] overflow-y-auto">
      <div className="flex flex-col gap-2 w-full max-w-xs pointer-events-auto">
        {minimizedDialogs.map((dialog) => (
          <div
            key={dialog.id}
            className={cn(
              "bg-background border rounded-md shadow-md flex items-center justify-between p-2",
              "group hover:bg-accent/50 dark:hover:bg-accent/30 transition-colors"
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => {
              console.log("🔔 PHONE DIALOG TASKBAR - Restoring dialog:", dialog.id);
              minimizeDialog(dialog.id, false);
              focusDialog(dialog.id);
            }}>
              <div className="flex-shrink-0 h-8 w-8 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div className="truncate">
                <p className="text-sm font-medium truncate">
                  {dialog.lead?.name || "Phone"}
                </p>
                <p className="text-xs text-muted-foreground truncate">Phone call</p>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  console.log("🔔 PHONE DIALOG TASKBAR - Maximizing dialog:", dialog.id);
                  minimizeDialog(dialog.id, false);
                  focusDialog(dialog.id);
                }}
              >
                <span className="sr-only">Maximize</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive/90"
                onClick={() => {
                  console.log("🔔 PHONE DIALOG TASKBAR - Closing dialog:", dialog.id);
                  closePhoneDialog(dialog.id);
                }}
              >
                <span className="sr-only">Close</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 