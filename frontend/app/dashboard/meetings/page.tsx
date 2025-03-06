'use client';

import { Calendar } from 'lucide-react';

export default function MeetingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Meetings</h2>
      </div>
      
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-2xl font-semibold mb-2">Meetings Module</h3>
        <p className="text-muted-foreground max-w-md">
          This feature is coming soon. You'll be able to schedule and manage all your meetings with leads and clients.
        </p>
      </div>
    </div>
  );
} 