'use client';

import { MessageSquare } from 'lucide-react';

export default function CommunicationsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Communications</h2>
      </div>
      
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-2xl font-semibold mb-2">Communications Module</h3>
        <p className="text-muted-foreground max-w-md">
          This feature is coming soon. You'll be able to manage all your customer communications in one place.
        </p>
      </div>
    </div>
  );
} 