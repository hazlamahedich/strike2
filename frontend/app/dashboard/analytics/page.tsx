'use client';

import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      </div>
      
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-2xl font-semibold mb-2">Analytics Module</h3>
        <p className="text-muted-foreground max-w-md">
          This feature is coming soon. You'll be able to view detailed analytics and reports about your leads, campaigns, and sales performance.
        </p>
      </div>
    </div>
  );
} 