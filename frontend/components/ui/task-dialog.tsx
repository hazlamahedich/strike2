'use client';

import React, { ReactNode, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskDialogType } from '@/contexts/TaskDialogContext';
import { X, Minus, Maximize, Maximize2, Minimize2, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskDialog } from '@/contexts/TaskDialogContext';
import { cn } from '@/lib/utils';
import { motion, useDragControls } from 'framer-motion';

interface TaskDialogContentProps {
  children: ReactNode;
  dialogId: string;
  dialogType: TaskDialogType;
  title: string;
  onClose?: () => void;
}

export function TaskDialogContent({
  children,
  dialogId,
  dialogType,
  title,
  onClose
}: TaskDialogContentProps) {
  const {
    closeTaskDialog,
    minimizeDialog,
    maximizeDialog,
    getDialogData,
    focusDialog,
    getAllDialogs,
    setDialogs
  } = useTaskDialog();

  const dialogData = getDialogData(dialogId);
  const isMinimized = dialogData?.minimized || false;
  const isMaximized = dialogData?.maximized || false;
  const zIndex = dialogData?.zIndex || 50;
  const allDialogs = getAllDialogs();
  const dragControls = useDragControls();
  const constraintsRef = useRef(null);
  
  // Use a very high z-index to ensure the dialog is on top of all elements
  const baseZIndex = 9999;
  const dialogZIndex = baseZIndex + zIndex;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      closeTaskDialog(dialogId);
    }
  };

  const handleMinimize = () => {
    minimizeDialog(dialogId, true);
  };

  const handleMaximize = () => {
    maximizeDialog(dialogId, !isMaximized);
  };

  const handleRestore = () => {
    minimizeDialog(dialogId, false);
  };

  const handleDialogClick = () => {
    focusDialog(dialogId);
  };

  const handleDragEnd = (_: any, info: any) => {
    // Update position in context when drag ends
    if (dialogData && !isMaximized) {
      const updatedPosition = {
        x: (dialogData.position?.x || 0) + info.offset.x,
        y: (dialogData.position?.y || 0) + info.offset.y
      };
      
      // Update dialog position
      const newDialogs = [...allDialogs];
      const dialogIndex = newDialogs.findIndex(d => d.id === dialogId);
      if (dialogIndex >= 0) {
        newDialogs[dialogIndex] = {
          ...newDialogs[dialogIndex],
          position: updatedPosition
        };
        setDialogs(newDialogs);
      }
    }
  };

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!isMaximized) {
      dragControls.start(event);
    }
  }

  // If minimized, show only the title bar
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-0 left-0 bg-background border rounded-t-md shadow-lg w-64 cursor-pointer"
        onClick={handleRestore}
        style={{ 
          left: dialogData?.position?.x || 20,
          zIndex: dialogZIndex 
        }}
      >
        <div className="flex items-center justify-between p-2">
          <div className="text-sm font-medium truncate">{title}</div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleRestore}>
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Position and size for the dialog
  const dialogPosition = dialogData?.position || { x: 'calc(50% - 300px)', y: 100 };
  const dialogSize = isMaximized 
    ? { width: 'calc(100vw - 40px)', height: 'calc(100vh - 40px)' } 
    : { width: '600px', maxHeight: '80vh' };

  return (
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: baseZIndex - 1 }}>
      <motion.div
        className="fixed shadow-xl border rounded-md bg-background overflow-hidden pointer-events-auto"
        style={{
          top: isMaximized ? '20px' : dialogPosition.y,
          left: isMaximized ? '20px' : dialogPosition.x,
          width: dialogSize.width,
          height: isMaximized ? dialogSize.height as string : 'auto',
          maxHeight: !isMaximized ? dialogSize.maxHeight as string : undefined,
          zIndex: dialogZIndex,
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={handleDialogClick}
        drag={!isMaximized}
        dragControls={dragControls}
        dragConstraints={constraintsRef}
        dragListener={false}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col h-full">
          <div 
            className="flex items-center justify-between p-4 border-b select-none"
            onPointerDown={startDrag}
            style={{ cursor: isMaximized ? 'default' : 'move', touchAction: 'none' }}
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className={cn("h-4 w-4 text-muted-foreground", isMaximized && "invisible")} />
              <h3 className="text-lg font-medium">{title}</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleMinimize}>
                <Minus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleMaximize}>
                {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className={cn("overflow-auto", isMaximized ? "flex-grow" : "")}>
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
} 