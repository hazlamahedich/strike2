'use client';

import React, { forwardRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDialog } from '@/lib/contexts/DialogContext';

// Props for the MultiDialog component
interface MultiDialogProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> {
  dialogId: string;
  children: React.ReactNode;
}

// The main MultiDialog component
export const MultiDialog = ({ dialogId, children, ...props }: MultiDialogProps) => {
  const { isDialogOpen, openDialog, closeDialog } = useDialog();
  
  return (
    <DialogPrimitive.Root
      open={isDialogOpen(dialogId)}
      onOpenChange={(open) => {
        if (open) {
          openDialog(dialogId);
        } else {
          closeDialog(dialogId);
        }
      }}
      {...props}
    >
      {children}
    </DialogPrimitive.Root>
  );
};

// MultiDialogTrigger component
interface MultiDialogTriggerProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger> {
  dialogId: string;
}

export const MultiDialogTrigger = ({ dialogId, ...props }: MultiDialogTriggerProps) => {
  const { openDialog } = useDialog();
  
  return (
    <DialogPrimitive.Trigger
      onClick={() => openDialog(dialogId)}
      {...props}
    />
  );
};

// Re-export DialogPortal
export const MultiDialogPortal = DialogPrimitive.Portal;

// Re-export DialogClose with enhanced functionality
interface MultiDialogCloseProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close> {
  dialogId: string;
}

export const MultiDialogClose = ({ dialogId, ...props }: MultiDialogCloseProps) => {
  const { closeDialog } = useDialog();
  
  return (
    <DialogPrimitive.Close
      onClick={() => closeDialog(dialogId)}
      {...props}
    />
  );
};

// MultiDialogOverlay component
export const MultiDialogOverlay = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
MultiDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// MultiDialogContent component
interface MultiDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  dialogId: string;
}

export const MultiDialogContent = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  MultiDialogContentProps
>(({ className, children, dialogId, ...props }, ref) => (
  <MultiDialogPortal>
    <MultiDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <MultiDialogClose dialogId={dialogId} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </MultiDialogClose>
    </DialogPrimitive.Content>
  </MultiDialogPortal>
));
MultiDialogContent.displayName = DialogPrimitive.Content.displayName;

// MultiDialogHeader component
export const MultiDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
MultiDialogHeader.displayName = "MultiDialogHeader";

// MultiDialogFooter component
export const MultiDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
MultiDialogFooter.displayName = "MultiDialogFooter";

// MultiDialogTitle component
export const MultiDialogTitle = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
MultiDialogTitle.displayName = DialogPrimitive.Title.displayName;

// MultiDialogDescription component
export const MultiDialogDescription = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
MultiDialogDescription.displayName = DialogPrimitive.Description.displayName; 