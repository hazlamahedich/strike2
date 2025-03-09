'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useMultiDialog } from '@/hooks/useMultiDialog';
import {
  MultiDialog,
  MultiDialogContent,
  MultiDialogHeader,
  MultiDialogTitle,
  MultiDialogDescription,
  MultiDialogFooter,
} from '@/components/ui/multi-dialog';
import { MultiDialogNav } from '../multi-dialog-nav';

export default function MultiDialogHookDemoPage() {
  // Create dialogs using the hook
  const dialog1 = useMultiDialog({ prefix: 'demo-1' });
  const dialog2 = useMultiDialog({ prefix: 'demo-2' });
  const dialog3 = useMultiDialog({ prefix: 'demo-3' });
  const dialog4 = useMultiDialog({ prefix: 'demo-4' });
  
  // Function to close all dialogs
  const closeAllDialogs = () => {
    dialog1.close();
    dialog2.close();
    dialog3.close();
    dialog4.close();
  };
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">useMultiDialog Hook Demo</h1>
      <p className="text-muted-foreground mb-8">
        This demo shows how to use the useMultiDialog hook to simplify working with multiple dialogs.
      </p>
      
      <MultiDialogNav />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Dialog Controls</h2>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={dialog1.open}
              variant="default"
            >
              Open Dialog 1
            </Button>
            
            <Button 
              onClick={dialog2.open}
              variant="secondary"
            >
              Open Dialog 2
            </Button>
            
            <Button 
              onClick={dialog3.open}
              variant="outline"
            >
              Open Dialog 3
            </Button>
            
            <Button 
              onClick={dialog4.open}
              variant="destructive"
            >
              Open Dialog 4
            </Button>
          </div>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Dialog Status</h2>
          <ul className="space-y-2">
            <li className="flex items-center justify-between">
              <span>Dialog 1:</span>
              <span className={`px-2 py-1 rounded text-sm ${dialog1.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {dialog1.isOpen ? 'Open' : 'Closed'}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Dialog 2:</span>
              <span className={`px-2 py-1 rounded text-sm ${dialog2.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {dialog2.isOpen ? 'Open' : 'Closed'}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Dialog 3:</span>
              <span className={`px-2 py-1 rounded text-sm ${dialog3.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {dialog3.isOpen ? 'Open' : 'Closed'}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Dialog 4:</span>
              <span className={`px-2 py-1 rounded text-sm ${dialog4.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {dialog4.isOpen ? 'Open' : 'Closed'}
              </span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="p-6 border rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <p className="mb-4">
          This demo showcases the <code>useMultiDialog</code> hook, which makes it easier to work with multiple dialogs.
          Try opening different combinations of dialogs and observe how they can all be open at the same time.
        </p>
        <p>
          The hook provides a simple API for managing dialog state and provides the necessary props for the dialog components.
        </p>
      </div>
      
      {/* Dialog 1 */}
      <MultiDialog {...dialog1.dialogProps}>
        <MultiDialogContent {...dialog1.contentProps} className="bg-white">
          <MultiDialogHeader>
            <MultiDialogTitle>Dialog 1</MultiDialogTitle>
            <MultiDialogDescription>
              This is the first dialog. You can open other dialogs while keeping this one open.
            </MultiDialogDescription>
          </MultiDialogHeader>
          <div className="py-4">
            <p className="mb-4">Try opening Dialog 2 while keeping this dialog open:</p>
            <Button 
              onClick={dialog2.open}
              variant="outline"
              size="sm"
            >
              Open Dialog 2
            </Button>
          </div>
          <MultiDialogFooter>
            <Button 
              onClick={dialog1.close}
              variant="default"
            >
              Close
            </Button>
          </MultiDialogFooter>
        </MultiDialogContent>
      </MultiDialog>
      
      {/* Dialog 2 */}
      <MultiDialog {...dialog2.dialogProps}>
        <MultiDialogContent {...dialog2.contentProps} className="bg-blue-50">
          <MultiDialogHeader>
            <MultiDialogTitle>Dialog 2</MultiDialogTitle>
            <MultiDialogDescription>
              This is the second dialog with a blue background.
            </MultiDialogDescription>
          </MultiDialogHeader>
          <div className="py-4">
            <p className="mb-4">You can open Dialog 3 from here:</p>
            <Button 
              onClick={dialog3.open}
              variant="outline"
              size="sm"
            >
              Open Dialog 3
            </Button>
          </div>
          <MultiDialogFooter>
            <Button 
              onClick={dialog2.close}
              variant="secondary"
            >
              Close
            </Button>
          </MultiDialogFooter>
        </MultiDialogContent>
      </MultiDialog>
      
      {/* Dialog 3 */}
      <MultiDialog {...dialog3.dialogProps}>
        <MultiDialogContent {...dialog3.contentProps} className="bg-green-50">
          <MultiDialogHeader>
            <MultiDialogTitle>Dialog 3</MultiDialogTitle>
            <MultiDialogDescription>
              This is the third dialog with a green background.
            </MultiDialogDescription>
          </MultiDialogHeader>
          <div className="py-4">
            <p className="mb-4">You can open Dialog 4 from here:</p>
            <Button 
              onClick={dialog4.open}
              variant="outline"
              size="sm"
            >
              Open Dialog 4
            </Button>
          </div>
          <MultiDialogFooter>
            <Button 
              onClick={dialog3.close}
              variant="outline"
            >
              Close
            </Button>
          </MultiDialogFooter>
        </MultiDialogContent>
      </MultiDialog>
      
      {/* Dialog 4 */}
      <MultiDialog {...dialog4.dialogProps}>
        <MultiDialogContent {...dialog4.contentProps} className="bg-red-50">
          <MultiDialogHeader>
            <MultiDialogTitle>Dialog 4</MultiDialogTitle>
            <MultiDialogDescription>
              This is the fourth dialog with a red background.
            </MultiDialogDescription>
          </MultiDialogHeader>
          <div className="py-4">
            <p className="mb-4">You can close all dialogs at once:</p>
            <Button 
              onClick={closeAllDialogs}
              variant="destructive"
              size="sm"
            >
              Close All Dialogs
            </Button>
          </div>
          <MultiDialogFooter>
            <Button 
              onClick={dialog4.close}
              variant="destructive"
            >
              Close
            </Button>
          </MultiDialogFooter>
        </MultiDialogContent>
      </MultiDialog>
    </div>
  );
} 