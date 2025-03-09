# Multiple Dialog Functionality

This document explains how to use the multiple dialog functionality in the application.

## Overview

The multiple dialog functionality allows you to open multiple dialogs simultaneously, which is useful for complex workflows where users need to interact with multiple pieces of information at once.

## Components

The implementation consists of several parts:

1. **DialogContext**: A React context that manages the state of multiple dialogs.
2. **MultiDialog Components**: Enhanced versions of the standard dialog components that work with the DialogContext.
3. **useMultiDialog Hook**: A custom hook that simplifies working with multiple dialogs.
4. **Utility Functions**: Helper functions for working with dialogs.

## Basic Usage

### Using the MultiDialog Components

```tsx
import { useDialog } from '@/lib/contexts/DialogContext';
import {
  MultiDialog,
  MultiDialogContent,
  MultiDialogHeader,
  MultiDialogTitle,
  MultiDialogDescription,
  MultiDialogFooter,
} from '@/components/ui/multi-dialog';
import { Button } from '@/components/ui/button';

export default function MyComponent() {
  const { openDialog, closeDialog, isDialogOpen } = useDialog();
  
  const DIALOG_ID = 'my-dialog';
  
  return (
    <>
      <Button onClick={() => openDialog(DIALOG_ID)}>
        Open Dialog
      </Button>
      
      <MultiDialog dialogId={DIALOG_ID}>
        <MultiDialogContent dialogId={DIALOG_ID}>
          <MultiDialogHeader>
            <MultiDialogTitle>My Dialog</MultiDialogTitle>
            <MultiDialogDescription>
              This is a dialog that can be open alongside other dialogs.
            </MultiDialogDescription>
          </MultiDialogHeader>
          <div className="py-4">
            <p>Dialog content goes here...</p>
          </div>
          <MultiDialogFooter>
            <Button onClick={() => closeDialog(DIALOG_ID)}>
              Close
            </Button>
          </MultiDialogFooter>
        </MultiDialogContent>
      </MultiDialog>
    </>
  );
}
```

### Using the useMultiDialog Hook

The `useMultiDialog` hook simplifies working with multiple dialogs by providing a clean API and handling the dialog ID management for you.

```tsx
import { useMultiDialog } from '@/hooks/useMultiDialog';
import {
  MultiDialog,
  MultiDialogContent,
  MultiDialogHeader,
  MultiDialogTitle,
  MultiDialogDescription,
  MultiDialogFooter,
} from '@/components/ui/multi-dialog';
import { Button } from '@/components/ui/button';

export default function MyComponent() {
  const dialog = useMultiDialog({ prefix: 'my-dialog' });
  
  return (
    <>
      <Button onClick={dialog.open}>
        Open Dialog
      </Button>
      
      <MultiDialog {...dialog.dialogProps}>
        <MultiDialogContent {...dialog.contentProps}>
          <MultiDialogHeader>
            <MultiDialogTitle>My Dialog</MultiDialogTitle>
            <MultiDialogDescription>
              This is a dialog that can be open alongside other dialogs.
            </MultiDialogDescription>
          </MultiDialogHeader>
          <div className="py-4">
            <p>Dialog content goes here...</p>
          </div>
          <MultiDialogFooter>
            <Button onClick={dialog.close}>
              Close
            </Button>
          </MultiDialogFooter>
        </MultiDialogContent>
      </MultiDialog>
    </>
  );
}
```

## Advanced Usage

### Creating Dialog Sets

For components that need multiple related dialogs, you can use the `createDialogIdSet` utility function:

```tsx
import { createDialogIdSet } from '@/lib/utils/multiDialogUtils';
import { useDialog } from '@/lib/contexts/DialogContext';

export default function MyComponent() {
  const { openDialog } = useDialog();
  
  // Create a set of dialog IDs
  const DIALOGS = createDialogIdSet('lead', ['create', 'edit', 'view', 'delete']);
  
  // Now you can use them like this:
  return (
    <>
      <Button onClick={() => openDialog(DIALOGS.CREATE)}>
        Create Lead
      </Button>
      
      <Button onClick={() => openDialog(DIALOGS.EDIT)}>
        Edit Lead
      </Button>
      
      {/* ... */}
    </>
  );
}
```

### Positioning Dialogs Relative to Triggers

You can position dialogs relative to the element that triggered them using the `positionDialogRelativeToTrigger` utility function:

```tsx
import { useRef, useEffect } from 'react';
import { positionDialogRelativeToTrigger } from '@/lib/utils/multiDialogUtils';
import { useMultiDialog } from '@/hooks/useMultiDialog';

export default function MyComponent() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialog = useMultiDialog();
  
  useEffect(() => {
    if (dialog.isOpen && triggerRef.current && dialogRef.current) {
      positionDialogRelativeToTrigger(dialogRef.current, triggerRef.current);
    }
  }, [dialog.isOpen]);
  
  return (
    <>
      <Button ref={triggerRef} onClick={dialog.open}>
        Open Dialog
      </Button>
      
      <MultiDialog {...dialog.dialogProps}>
        <MultiDialogContent {...dialog.contentProps} ref={dialogRef}>
          {/* Dialog content */}
        </MultiDialogContent>
      </MultiDialog>
    </>
  );
}
```

## Demo Pages

The application includes two demo pages that showcase the multiple dialog functionality:

1. `/multi-dialog-demo`: Demonstrates the basic MultiDialog components.
2. `/multi-dialog-hook-demo`: Demonstrates the useMultiDialog hook.

Visit these pages to see the functionality in action and to understand how to implement it in your own components. 