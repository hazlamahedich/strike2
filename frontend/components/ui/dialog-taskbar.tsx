'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useImprovedDialog } from '@/lib/contexts/ImprovedDialogContext';
import { Minimize, Maximize2, X, LayoutGrid, ChevronsDown, Minimize2 } from 'lucide-react';

interface DialogTaskbarProps {
  className?: string;
}

/**
 * A taskbar component that displays all open dialogs and provides
 * controls to manage them (minimize, restore, close, etc.)
 */
export function DialogTaskbar({ className }: DialogTaskbarProps) {
  const { 
    openDialogs, 
    minimizeDialog, 
    maximizeDialog,
    closeDialog, 
    focusDialog,
    arrangeDialogsCascade,
    arrangeDialogsTile
  } = useImprovedDialog();

  // If no open dialogs, don't render the taskbar
  if (openDialogs.length === 0) {
    return null;
  }

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 h-12 bg-background border-t flex items-center px-4 z-[100] dialog-taskbar",
        className
      )}
      role="dialog-taskbar"
      data-taskbar="true"
      onClick={(e) => {
        // Prevent clicks on the taskbar from propagating to the document
        // which would trigger the "click outside" handler
        e.stopPropagation();
        console.log('[Taskbar] Click intercepted and stopped from propagation');
      }}
    >
      <div className="flex-1 flex items-center space-x-2 overflow-x-auto pb-1 pt-1">
        {/* Window arrangement controls */}
        <div className="pr-4 border-r mr-2 flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => arrangeDialogsCascade()}
            title="Cascade Windows"
          >
            <ChevronsDown className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => arrangeDialogsTile('horizontal')}
            title="Tile Windows Horizontally"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Dialog buttons */}
        {openDialogs.map((dialog) => (
          <Button
            key={dialog.id}
            variant={dialog.isActive ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 transition-all relative group",
              dialog.isActive && "ring-1 ring-primary",
              dialog.minimized && "opacity-70",
              dialog.maximized && "font-semibold"
            )}
            onClick={() => {
              console.log(`[Taskbar] Dialog button clicked for ${dialog.id}, minimized: ${dialog.minimized}`);
              if (dialog.minimized) {
                console.log(`[Taskbar] Attempting to restore minimized dialog: ${dialog.id}`);
                minimizeDialog(dialog.id, false);
                console.log(`[Taskbar] Minimize dialog call completed, now focusing dialog`);
              }
              focusDialog(dialog.id);
              console.log(`[Taskbar] Focus dialog call completed`);
            }}
          >
            <span className="max-w-[160px] truncate">
              {dialog.id}
              {dialog.maximized && <span className="ml-1 text-xs">[max]</span>}
            </span>
            
            {/* Quick action buttons that appear on hover */}
            <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-background/90 rounded pl-1">
              {/* Minimize/restore button - using div instead of Button to avoid nesting */}
              <div
                className="h-5 w-5 rounded-sm flex items-center justify-center cursor-pointer hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation();
                  minimizeDialog(dialog.id, !dialog.minimized);
                }}
                title={dialog.minimized ? "Restore" : "Minimize"}
                role="button"
                tabIndex={0}
              >
                <Minimize className="h-3 w-3" />
              </div>
              
              {/* Maximize/restore button - using div instead of Button */}
              <div
                className="h-5 w-5 rounded-sm flex items-center justify-center cursor-pointer hover:bg-accent"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    console.log(`[Taskbar] Toggling maximize for ${dialog.id}`);
                    // Use a delay to ensure state updates properly
                    setTimeout(() => {
                      maximizeDialog(dialog.id, !dialog.maximized);
                      // Focus the dialog after maximizing
                      setTimeout(() => {
                        focusDialog(dialog.id);
                      }, 100);
                    }, 50);
                  } catch (err) {
                    console.error(`[Taskbar] Error maximizing dialog:`, err);
                  }
                  return false; // Completely stop event bubbling
                }}
                title={dialog.maximized ? "Restore" : "Maximize"}
                role="button"
                tabIndex={0}
              >
                {dialog.maximized ? 
                  <Minimize2 className="h-3 w-3" /> : 
                  <Maximize2 className="h-3 w-3" />
                }
              </div>
              
              {/* Close button - using div instead of Button */}
              <div
                className="h-5 w-5 rounded-sm flex items-center justify-center cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  closeDialog(dialog.id);
                }}
                title="Close"
                role="button"
                tabIndex={0}
              >
                <X className="h-3 w-3" />
              </div>
            </div>
          </Button>
        ))}
      </div>
      
      {/* Status information */}
      <div className="text-xs text-muted-foreground pr-2">
        {openDialogs.length} {openDialogs.length === 1 ? 'window' : 'windows'}
      </div>
    </div>
  );
}

export default DialogTaskbar; 