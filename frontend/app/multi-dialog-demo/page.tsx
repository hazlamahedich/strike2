'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useDialog } from '@/lib/contexts/DialogContext';
import {
  MultiDialog,
  MultiDialogContent,
  MultiDialogHeader,
  MultiDialogTitle,
  MultiDialogDescription,
  MultiDialogFooter,
} from '@/components/ui/multi-dialog';
import { MultiDialogNav } from '../multi-dialog-nav';

export default function MultiDialogDemoPage() {
  const { openDialog, closeDialog, isDialogOpen } = useDialog();

  // Define dialog IDs
  const DIALOG_IDS = {
    DIALOG_1: 'dialog-1',
    DIALOG_2: 'dialog-2',
    DIALOG_3: 'dialog-3',
    DIALOG_4: 'dialog-4',
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Multiple Dialog Demo</h1>
      <p className="text-muted-foreground mb-8">
        This demo shows how to use the MultiDialog components to display multiple dialogs simultaneously.
      </p>
      
      <MultiDialogNav />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Dialog Controls</h2>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => openDialog(DIALOG_IDS.DIALOG_1)}
              variant="default"
            >
              Open Dialog 1
            </Button>
            
            <Button 
              onClick={() => openDialog(DIALOG_IDS.DIALOG_2)}
              variant="secondary"
            >
              Open Dialog 2
            </Button>
            
            <Button 
              onClick={() => openDialog(DIALOG_IDS.DIALOG_3)}
              variant="outline"
            >
              Open Dialog 3
            </Button>
            
            <Button 
              onClick={() => openDialog(DIALOG_IDS.DIALOG_4)}
              variant="destructive"
            >
              Open Dialog 4
            </Button>
          </div>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Dialog Status</h2>
          <ul className="space-y-2">
            {Object.entries(DIALOG_IDS).map(([key, id]) => (
              <li key={id} className="flex items-center justify-between">
                <span>{key}:</span>
                <span className={`px-2 py-1 rounded text-sm ${isDialogOpen(id) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {isDialogOpen(id) ? 'Open' : 'Closed'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <p className="mb-4">
          This demo showcases the ability to have multiple dialogs open simultaneously. 
          Try opening different combinations of dialogs and observe how they can all be open at the same time.
        </p>
        <p>
          Each dialog can be closed individually without affecting the others.
        </p>
      </div>
      
      {/* Dialog 1 */}
      <MultiDialog dialogId={DIALOG_IDS.DIALOG_1}>
        <MultiDialogContent dialogId={DIALOG_IDS.DIALOG_1} className="bg-white">
          <MultiDialogHeader>
            <MultiDialogTitle>Dialog 1</MultiDialogTitle>
            <MultiDialogDescription>
              This is the first dialog. You can open other dialogs while keeping this one open.
            </MultiDialogDescription>
          </MultiDialogHeader>
          <div className="py-4">
            <p className="mb-4">Try opening Dialog 2 while keeping this dialog open:</p>
            <Button 
              onClick={() => openDialog(DIALOG_IDS.DIALOG_2)}
              variant="outline"
              size="sm"
            >
              Open Dialog 2
            </Button>
          </div>
          <MultiDialogFooter>
            <Button 
              onClick={() => closeDialog(DIALOG_IDS.DIALOG_1)}
              variant="default"
            >
              Close
            </Button>
          </MultiDialogFooter>
        </MultiDialogContent>
      </MultiDialog>
      
      {/* Dialog 2 */}
      <MultiDialog dialogId={DIALOG_IDS.DIALOG_2}>
        <MultiDialogContent dialogId={DIALOG_IDS.DIALOG_2} className="bg-blue-50">
          <MultiDialogHeader>
            <MultiDialogTitle>Dialog 2</MultiDialogTitle>
            <MultiDialogDescription>
              This is the second dialog with a blue background.
            </MultiDialogDescription>
          </MultiDialogHeader>
          <div className="py-4">
            <p className="mb-4">You can open Dialog 3 from here:</p>
            <Button 
              onClick={() => openDialog(DIALOG_IDS.DIALOG_3)}
              variant="outline"
              size="sm"
            >
              Open Dialog 3
            </Button>
          </div>
          <MultiDialogFooter>
            <Button 
              onClick={() => closeDialog(DIALOG_IDS.DIALOG_2)}
              variant="secondary"
            >
              Close
            </Button>
          </MultiDialogFooter>
        </MultiDialogContent>
      </MultiDialog>
      
      {/* Dialog 3 */}
      <MultiDialog dialogId={DIALOG_IDS.DIALOG_3}>
        <MultiDialogContent dialogId={DIALOG_IDS.DIALOG_3} className="bg-green-50">
          <MultiDialogHeader>
            <MultiDialogTitle>Dialog 3</MultiDialogTitle>
            <MultiDialogDescription>
              This is the third dialog with a green background.
            </MultiDialogDescription>
          </MultiDialogHeader>
          <div className="py-4">
            <p className="mb-4">You can open Dialog 4 from here:</p>
            <Button 
              onClick={() => openDialog(DIALOG_IDS.DIALOG_4)}
              variant="outline"
              size="sm"
            >
              Open Dialog 4
            </Button>
          </div>
          <MultiDialogFooter>
            <Button 
              onClick={() => closeDialog(DIALOG_IDS.DIALOG_3)}
              variant="outline"
            >
              Close
            </Button>
          </MultiDialogFooter>
        </MultiDialogContent>
      </MultiDialog>
      
      {/* Dialog 4 */}
      <MultiDialog dialogId={DIALOG_IDS.DIALOG_4}>
        <MultiDialogContent dialogId={DIALOG_IDS.DIALOG_4} className="bg-red-50">
          <MultiDialogHeader>
            <MultiDialogTitle>Dialog 4</MultiDialogTitle>
            <MultiDialogDescription>
              This is the fourth dialog with a red background.
            </MultiDialogDescription>
          </MultiDialogHeader>
          <div className="py-4">
            <p className="mb-4">You can close all dialogs at once:</p>
            <Button 
              onClick={() => {
                Object.values(DIALOG_IDS).forEach(id => closeDialog(id));
              }}
              variant="destructive"
              size="sm"
            >
              Close All Dialogs
            </Button>
          </div>
          <MultiDialogFooter>
            <Button 
              onClick={() => closeDialog(DIALOG_IDS.DIALOG_4)}
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