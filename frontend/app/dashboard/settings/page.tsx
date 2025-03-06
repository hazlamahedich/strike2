'use client';

import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Settings className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-2xl font-semibold mb-2">Settings Module</h3>
        <p className="text-muted-foreground max-w-md">
          This feature is coming soon. You'll be able to customize your account settings, manage users, and configure application preferences.
        </p>
      </div>
    </div>
  );
} 