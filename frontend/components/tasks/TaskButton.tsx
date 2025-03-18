'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus } from 'lucide-react';
import { useTaskDialog } from '@/contexts/TaskDialogContext';
import { TaskDialogType } from '@/contexts/TaskDialogContext';
import { ContextualTaskDialog } from './ContextualTaskDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TaskButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  leadId?: number;
  leadName?: string;
  onTaskAdded?: (taskData: any) => void;
  className?: string;
}

export function TaskButton({
  variant = 'default',
  size = 'default',
  leadId,
  leadName,
  onTaskAdded,
  className
}: TaskButtonProps) {
  const { openTaskDialog, closeTaskDialog } = useTaskDialog();
  
  const handleClick = (e?: React.MouseEvent) => {
    // Prevent event propagation if this is part of a row
    if (e) {
      e.stopPropagation();
    }
    
    const dialogId = `add-task-${leadId || 'new'}-${Date.now()}`;
    
    openTaskDialog(
      dialogId,
      TaskDialogType.ADD,
      <ContextualTaskDialog
        dialogId={dialogId}
        leadId={leadId}
        leadName={leadName}
        handleClose={() => closeTaskDialog(dialogId)}
        handleTaskSuccess={onTaskAdded}
      />
    );
  };
  
  // For icon buttons (used in the leads table), wrap in a tooltip
  if (size === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={handleClick}
              className={className}
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add Task{leadName ? ` for ${leadName}` : ''}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Standard button display
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      <Plus className="h-4 w-4 mr-2" />
      Add Task
    </Button>
  );
} 