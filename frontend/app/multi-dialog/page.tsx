'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MultiDialogNav } from '../multi-dialog-nav';

export default function MultiDialogIndexPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Multiple Dialog Functionality</h1>
      <p className="text-muted-foreground mb-8">
        This feature allows you to open multiple dialogs simultaneously, which is useful for complex workflows.
      </p>
      
      <MultiDialogNav />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Basic Demo</h2>
          <p className="mb-4">
            This demo shows how to use the MultiDialog components to display multiple dialogs simultaneously.
          </p>
          <Link href="/multi-dialog-demo">
            <Button>View Basic Demo</Button>
          </Link>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Hook Demo</h2>
          <p className="mb-4">
            This demo shows how to use the useMultiDialog hook to simplify working with multiple dialogs.
          </p>
          <Link href="/multi-dialog-hook-demo">
            <Button variant="secondary">View Hook Demo</Button>
          </Link>
        </div>
      </div>
      
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Documentation</h2>
        <p className="mb-4">
          Read the documentation to learn how to use the multiple dialog functionality in your own components.
        </p>
        <Link href="/docs/multi-dialog.md" target="_blank">
          <Button variant="outline">View Documentation</Button>
        </Link>
      </div>
    </div>
  );
} 