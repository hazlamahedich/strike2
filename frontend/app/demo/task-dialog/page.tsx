'use client';

import React from 'react';
import { TaskButton } from '@/components/tasks/TaskButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TaskDialogDemo() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Task Dialog Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Task (No Lead)</CardTitle>
            <CardDescription>
              Opens a task dialog without a specific lead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TaskButton 
              variant="default"
              onTaskAdded={(task) => {
                console.log('Task added:', task);
              }}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Add Task (With Lead)</CardTitle>
            <CardDescription>
              Opens a task dialog for a specific lead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TaskButton 
              variant="outline"
              leadId={1}
              leadName="John Doe"
              onTaskAdded={(task) => {
                console.log('Task added for lead:', task);
              }}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Icon Button</CardTitle>
            <CardDescription>
              Task button displayed as an icon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TaskButton 
              variant="ghost"
              size="icon"
              onTaskAdded={(task) => {
                console.log('Task added from icon button:', task);
              }}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Custom Styling</CardTitle>
            <CardDescription>
              Task button with custom styling.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TaskButton 
              variant="secondary"
              className="w-full"
              onTaskAdded={(task) => {
                console.log('Task added from custom button:', task);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 