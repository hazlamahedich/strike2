'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, CheckCircle, Edit, Trash, Clock, Flag } from 'lucide-react';

interface TaskActionsMenuProps {
  task: any;
  onMarkComplete: (taskId: number, completed: boolean) => void;
  onEdit: (task: any) => void;
  onDelete: (taskId: number) => void;
}

export function TaskActionsMenu({
  task,
  onMarkComplete,
  onEdit,
  onDelete,
}: TaskActionsMenuProps) {
  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-amber-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Task Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onMarkComplete(task.id, !task.completed)}>
          <CheckCircle className={`h-4 w-4 mr-2 ${task.completed ? 'text-green-500' : 'text-gray-400'}`} />
          {task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(task)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Task
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-red-500 focus:text-red-500" 
          onClick={() => {
            if (confirm('Are you sure you want to delete this task?')) {
              onDelete(task.id);
            }
          }}
        >
          <Trash className="h-4 w-4 mr-2" />
          Delete Task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 