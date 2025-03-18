'use client';

import React from 'react';
import { format } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import type { SMSMessage } from '../../types/communications';

interface SMSLogProps {
  messages: SMSMessage[];
}

export default function SMSLog({ messages }: SMSLogProps) {
  console.log("⭐⭐⭐ SMS LOG - Rendering with", messages.length, "messages");
  
  if (messages.length === 0) {
    return (
      <div className="text-center p-4 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">No messages yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div 
          key={message.id} 
          className={`p-4 rounded-lg flex ${
            message.direction === 'outbound' 
              ? 'bg-primary text-primary-foreground ml-8' 
              : 'bg-muted mr-8'
          }`}
        >
          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span className="text-xs font-medium">
                  {message.direction === 'outbound' ? 'You' : 'Contact'}
                </span>
              </div>
              <span className="text-xs opacity-70">
                {format(new Date(message.sent_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
            <p className="text-sm">{message.body}</p>
            <div className="flex justify-end">
              <span className={`text-xs ${
                message.status === 'delivered' || message.status === 'received'
                  ? 'opacity-70'
                  : 'text-red-300'
              }`}>
                {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 