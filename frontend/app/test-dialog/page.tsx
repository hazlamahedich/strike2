'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SimpleMeetingForm } from '@/components/meetings/SimpleMeetingForm';

export default function TestDialogPage() {
  const [showDialog, setShowDialog] = useState(false);
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Dialog Test Page</h1>
      
      <div className="space-y-8">
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Method 1: Direct State Control</h2>
          <Button onClick={() => setShowDialog(true)}>
            Open Dialog (State)
          </Button>
          
          {showDialog && (
            <Dialog open={true} onOpenChange={setShowDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog Test (State)</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p>This dialog is controlled directly by state.</p>
                  <SimpleMeetingForm 
                    onSuccess={() => setShowDialog(false)} 
                    onCancel={() => setShowDialog(false)} 
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Method 2: DialogTrigger</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                Open Dialog (Trigger)
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Test (Trigger)</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>This dialog is controlled by DialogTrigger.</p>
                <SimpleMeetingForm />
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Method 3: Basic HTML</h2>
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => {
              const dialog = document.getElementById('basic-dialog') as HTMLDialogElement;
              if (dialog) dialog.showModal();
            }}
          >
            Open Dialog (HTML)
          </button>
          
          <dialog id="basic-dialog" className="p-6 rounded-lg shadow-lg backdrop:bg-black backdrop:bg-opacity-50">
            <h3 className="text-lg font-semibold mb-4">Basic HTML Dialog</h3>
            <p className="mb-4">This is a basic HTML dialog element.</p>
            <div className="flex justify-end">
              <button 
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                onClick={() => {
                  const dialog = document.getElementById('basic-dialog') as HTMLDialogElement;
                  if (dialog) dialog.close();
                }}
              >
                Close
              </button>
            </div>
          </dialog>
        </div>
      </div>
    </div>
  );
} 