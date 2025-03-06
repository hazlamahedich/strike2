'use client';

import { useState } from 'react';
import { MeetingList } from '@/components/meetings';
import { SimpleMeetingForm } from '@/components/meetings/SimpleMeetingForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

export default function MeetingsPage() {
  const [showDialog, setShowDialog] = useState(false);
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Meetings</h2>
        <div className="flex space-x-2">
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Direct Schedule
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Dialog Trigger
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Meeting (Page)</DialogTitle>
              </DialogHeader>
              <SimpleMeetingForm onSuccess={() => {}} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Direct dialog */}
      {showDialog && (
        <Dialog open={true} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Meeting (Direct)</DialogTitle>
            </DialogHeader>
            <SimpleMeetingForm 
              onSuccess={() => setShowDialog(false)} 
              onCancel={() => setShowDialog(false)} 
            />
          </DialogContent>
        </Dialog>
      )}
      
      <MeetingList />
    </div>
  );
} 