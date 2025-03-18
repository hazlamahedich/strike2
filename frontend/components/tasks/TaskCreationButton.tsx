'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTaskDialog } from '@/contexts/TaskDialogContext';
import { TaskDialogType } from '@/contexts/TaskDialogContext';
import { ContextualTaskDialog } from './ContextualTaskDialog';

interface TaskCreationButtonProps {
  leadId?: number;
  leadName?: string;
  onTaskCreated?: (taskData: any) => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function TaskCreationButton({
  leadId,
  leadName,
  onTaskCreated,
  variant = 'default',
  size = 'default'
}: TaskCreationButtonProps) {
  const { openTaskDialog, closeTaskDialog } = useTaskDialog();
  
  const handleClick = () => {
    const dialogId = `add-task-${leadId || 'new'}-${Date.now()}`;
    
    openTaskDialog(
      dialogId,
      TaskDialogType.ADD,
      <ContextualTaskDialog
        dialogId={dialogId}
        leadId={leadId}
        leadName={leadName}
        handleClose={() => closeTaskDialog(dialogId)}
        handleTaskSuccess={onTaskCreated}
      />
    );
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
    >
      <Plus className="h-4 w-4 mr-2" />
      Add Task
    </Button>
  );
} 