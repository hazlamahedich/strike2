'use client';

import { useState, useEffect } from 'react';
import { MeetingView } from '@/components/meetings/MeetingView';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function MeetingsPage() {
  const [error, setError] = useState<string | null>(null);
  
  // Log component mount for debugging
  useEffect(() => {
    console.log('MeetingsPage mounted');
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      console.log('Browser environment detected');
      
      // Check if localStorage is available
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        console.log('localStorage is available');
      } catch (err) {
        console.error('localStorage is not available:', err);
        setError('localStorage is not available. Some features may not work properly.');
      }
    }
    
    return () => {
      console.log('MeetingsPage unmounted');
    };
  }, []);
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Meetings</h2>
        <Link href="/dashboard/calendar-integrations">
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar Integrations
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      <div className="w-full">
        <MeetingView />
      </div>
    </div>
  );
} 