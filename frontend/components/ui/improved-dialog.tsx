'use client';

import React, { forwardRef, useRef, useEffect, useState, Fragment, useLayoutEffect, createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, GripVertical, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useImprovedDialog } from '@/lib/contexts/ImprovedDialogContext';

// Create a context to track whether we're inside a Radix Dialog context
type DialogContextType = {
  inRadixDialog: boolean;
};

const ImprovedDialogInternalContext = createContext<DialogContextType>({ inRadixDialog: false });

// Props for the ImprovedDialog component
interface ImprovedDialogRootProps {
  dialogId: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Root dialog component
export const ImprovedDialogRoot = ({
  dialogId,
  children,
  defaultOpen = false,
  onOpenChange,
}: ImprovedDialogRootProps) => {
  const { isDialogOpen, openDialog, closeDialog } = useImprovedDialog();
  const [initialized, setInitialized] = useState(false);
  const isOpen = isDialogOpen(dialogId);

  // Initialize dialog on mount if defaultOpen is true
  useEffect(() => {
    if (defaultOpen && !isOpen && !initialized) {
      // This only runs on initial mount if defaultOpen is true
      const dialogContent = React.Children.toArray(children)
        .find(child => {
          if (!React.isValidElement(child)) return false;
          
          const childType = child.type;
          if (typeof childType === 'string') return false;
          
          // Check if it has a dialogId prop matching ours
          const props = child.props as Record<string, unknown>;
          return props && props.dialogId === dialogId;
        });
              
      if (dialogContent && React.isValidElement(dialogContent)) {
        openDialog(dialogId, dialogContent);
        setInitialized(true);
      }
    }
  }, [defaultOpen, dialogId, children, isOpen, initialized, openDialog]);

  // Handle external open/close changes
  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  }, [isOpen, onOpenChange]);

  return (
    <ImprovedDialogInternalContext.Provider value={{ inRadixDialog: true }}>
      <DialogPrimitive.Root
        data-dialog-root={dialogId}
        open={isOpen}
        modal={false}  // Allow interaction with elements outside the dialog
        onOpenChange={(open) => {
          // Only allow closing via explicit actions (like buttons), not outside clicks
          if (open) {
            // When opening, find the ImprovedDialogContent component in children
            const dialogContent = React.Children.toArray(children)
              .find(child => {
                if (!React.isValidElement(child)) return false;
                
                const childType = child.type;
                if (typeof childType === 'string') return false;
                
                // Check if it has a dialogId prop matching ours
                const props = child.props as Record<string, unknown>;
                return props && props.dialogId === dialogId;
              });
              
            if (dialogContent && React.isValidElement(dialogContent)) {
              openDialog(dialogId, dialogContent);
            }
          } else {
            // Only proceed if it's an explicit close action, not clicking outside
            // This was triggered by a button within the dialog or programmatically
            closeDialog(dialogId);
          }
        }}
      >
        {children}
      </DialogPrimitive.Root>
    </ImprovedDialogInternalContext.Provider>
  );
};

// Trigger component
interface ImprovedDialogTriggerProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger> {
  dialogId?: string;
}

export const ImprovedDialogTrigger = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  ImprovedDialogTriggerProps
>(({ dialogId, onClick, ...props }, ref) => {
  const { openDialog, isDialogOpen } = useImprovedDialog();
  const { inRadixDialog } = useContext(ImprovedDialogInternalContext);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Call the original onClick handler if it exists
    if (onClick) onClick(e);
    
    // If we have a dialogId, find the corresponding content component and open it
    if (dialogId && inRadixDialog) {
      // Find the parent ImprovedDialogRoot component
      let parent = e.currentTarget.closest('[data-dialog-root]');
      if (parent) {
        const rootDialogId = parent.getAttribute('data-dialog-root');
        if (rootDialogId === dialogId) {
          // Find all siblings of the current trigger that might contain our content
          const root = parent.parentElement;
          if (root) {
            // Look for a content element with the matching dialogId
            const contentElements = Array.from(root.querySelectorAll(`[data-dialog-id="${dialogId}"]`));
            if (contentElements.length > 0) {
              const contentElement = contentElements[0];
              // Directly open the dialog without relying on Radix's mechanism
              if (!isDialogOpen(dialogId)) {
                e.stopPropagation(); // Prevent Radix from handling this
                openDialog(dialogId, contentElement);
              }
            }
          }
        }
      }
    }
  };
  
  return (
    <DialogPrimitive.Trigger 
      ref={ref} 
      onClick={handleClick}
      {...props} 
    />
  );
});
ImprovedDialogTrigger.displayName = 'ImprovedDialogTrigger';

// Position type for draggable dialogs
interface Position {
  x: number;
  y: number;
}

// Content component - this is what will be rendered for each open dialog
interface ImprovedDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  dialogId: string;
  showCloseButton?: boolean;
  draggable?: boolean;
}

// Create a standalone wrapper for dialog content
const StandaloneDialogContent = forwardRef<
  HTMLDivElement,
  ImprovedDialogContentProps & React.HTMLAttributes<HTMLDivElement>
>(({ className, children, dialogId, showCloseButton = true, draggable = true, ...props }, ref) => {
  const { getDialogZIndex, getDialogData, focusDialog, closeDialog, minimizeDialog, maximizeDialog } = useImprovedDialog();
  
  const dialogData = getDialogData(dialogId);
  const zIndex = getDialogZIndex(dialogId);
  const isActive = dialogData?.isActive || false;
  const isMinimized = dialogData?.minimized || false;
  const isMaximized = dialogData?.maximized || false;
  
  console.log(`[${dialogId}] StandaloneDialogContent rendering with states:`, {
    isActive,
    isMinimized,
    isMaximized,
    dialogData
  });
  
  // Debug on mount and state changes
  useEffect(() => {
    console.log(`[${dialogId}] StandaloneDialogContent mounted/updated:`, {
      isActive,
      isMinimized, 
      isMaximized
    });
    
    // Force isMinimized to be false directly in the DOM if needed
    if (dialogRef.current && !isMinimized) {
      dialogRef.current.setAttribute('data-minimized', 'false');
      
      // Make sure the content is visible
      const contentDiv = dialogRef.current.querySelector('[class*="isMinimized"]');
      if (contentDiv) {
        (contentDiv as HTMLElement).style.display = 'block';
      }
    }
  }, [dialogId, isActive, isMinimized, isMaximized]);
  
  // State for draggable position
  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [size, setSize] = useState<{ width: number | string, height: number | string } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  
  // Refs
  const dialogRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragStateRef = useRef({ dragging: false });
  const resizeStateRef = useRef({ resizing: false, direction: null as string | null });
  const startSizeRef = useRef({ width: 0, height: 0 });
  
  // Focus handling when clicked
  const handleContentClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent double-handling
    e.stopPropagation();
    
    // Don't handle clicks during drag operations
    if (dragStateRef.current.dragging) {
      console.log(`[${dialogId}] Ignoring click during drag operation`);
      return;
    }
    
    console.log(`[${dialogId}] Dialog clicked, isActive=${isActive}`);
    
    // Always focus the dialog when it's clicked, even if it's already active
    // This ensures consistent behavior when users click between multiple dialogs
    focusDialog(dialogId);
    console.log(`[${dialogId}] Dialog focused after click`);
  };
  
  // Handle the start of dragging
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggable || !dialogRef.current) {
      console.log(`[${dialogId}] DRAG START FAILED: draggable=${draggable}, dialogRef.current=${!!dialogRef.current}`);
      return;
    }
    
    // Prevent default behaviors
    e.preventDefault();
    
    // Focus the dialog
    focusDialog(dialogId);
    
    // Get current dialog position
    const rect = dialogRef.current.getBoundingClientRect();
    console.log(`[${dialogId}] DRAG START: Dialog rect=`, {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      mouseX: e.clientX,
      mouseY: e.clientY
    });
    
    // Calculate the offset of the mouse from the dialog's corner
    let offsetX, offsetY;
    if (position === null) {
      // For first drag, calculate the offset from the actual element position
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      console.log(`[${dialogId}] DRAG START: First drag, using rect offset`, { offsetX, offsetY });
    } else {
      // For subsequent drags, use the stored position
      offsetX = e.clientX - position.x;
      offsetY = e.clientY - position.y;
      console.log(`[${dialogId}] DRAG START: Subsequent drag, using position offset`, { 
        offsetX, 
        offsetY, 
        positionX: position.x, 
        positionY: position.y 
      });
    }
    
    // Store the offset for use during drag
    offsetRef.current = { x: offsetX, y: offsetY };
    
    // Set dragging flag in both state and ref
    dragStateRef.current.dragging = true;
    setIsDragging(true);
    
    console.log(`[${dialogId}] DRAG START: Adding move/end listeners`);
    
    // Add document level event listeners for move and end
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };
  
  // Handle drag movement
  const handleDragMove = (e: MouseEvent) => {
    if (!dragStateRef.current.dragging || !dialogRef.current) {
      console.log(`[${dialogId}] DRAG MOVE SKIPPED: dragging=${dragStateRef.current.dragging}, dialogRef=${!!dialogRef.current}`);
      return;
    }
    
    // Calculate new position
    const newX = e.clientX - offsetRef.current.x;
    const newY = e.clientY - offsetRef.current.y;
    
    // Get dialog dimensions
    const rect = dialogRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;
    
    // Set new position
    const finalX = Math.max(0, Math.min(newX, maxX));
    const finalY = Math.max(0, Math.min(newY, maxY));
    
    console.log(`[${dialogId}] DRAG MOVE:`, {
      mouseX: e.clientX,
      mouseY: e.clientY,
      offsetX: offsetRef.current.x,
      offsetY: offsetRef.current.y,
      newX,
      newY,
      finalX,
      finalY,
      dialogWidth: rect.width,
      dialogHeight: rect.height
    });
    
    // For immediate visual feedback, update the style directly
    if (dialogRef.current) {
      dialogRef.current.style.left = `${finalX}px`;
      dialogRef.current.style.top = `${finalY}px`;
      dialogRef.current.style.transform = 'none';
      dialogRef.current.style.transition = 'none';
      
      // Add a grab cursor to the whole dialog during dragging
      dialogRef.current.style.cursor = 'grabbing';
    }
    
    // Update state for persistence
    setPosition({ x: finalX, y: finalY });
  };
  
  // Handle end of dragging
  const handleDragEnd = (e: MouseEvent) => {
    console.log(`[${dialogId}] DRAG END at`, { x: e.clientX, y: e.clientY });
    
    // Reset dragging flag in both state and ref
    dragStateRef.current.dragging = false;
    setIsDragging(false);
    
    // Reset cursor
    if (dialogRef.current) {
      dialogRef.current.style.cursor = 'auto';
    }
    
    // Clean up document level event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    
    console.log(`[${dialogId}] DRAG END: Removed move/end listeners`);
  };
  
  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      console.log(`[${dialogId}] Dialog unmounting, cleaning up listeners`);
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [dialogId]);
  
  // Handle touch events
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggable || !dialogRef.current || e.touches.length !== 1) {
      console.log(`[${dialogId}] TOUCH START FAILED: draggable=${draggable}, touches=${e.touches.length}`);
      return;
    }
    
    e.preventDefault();
    const touch = e.touches[0];
    console.log(`[${dialogId}] TOUCH START at`, { x: touch.clientX, y: touch.clientY });
    
    // Create a synthetic mouse event
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => {},
      stopPropagation: () => {}
    } as unknown as React.MouseEvent<HTMLDivElement>;
    
    handleDragStart(mouseEvent);
    
    // Add specific touch handlers
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    console.log(`[${dialogId}] TOUCH START: Added move/end listeners`);
  };
  
  // Handle touch movement
  const handleTouchMove = (e: TouchEvent) => {
    if (!dragStateRef.current.dragging || e.touches.length !== 1) return;
    e.preventDefault(); // Prevent scrolling during drag
    
    const touch = e.touches[0];
    
    // Create a synthetic mouse event
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    handleDragMove(mouseEvent);
  };
  
  // Handle touch end
  const handleTouchEnd = (e: TouchEvent) => {
    const touch = e.changedTouches[0];
    
    // Create a synthetic mouse event
    const mouseEvent = new MouseEvent('mouseup', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    handleDragEnd(mouseEvent);
    
    // Clean up touch handlers
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    
    console.log(`[${dialogId}] TOUCH END: Removed move/end listeners`);
  };
  
  // Handle start of resize
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't allow resizing a maximized window
    if (isMaximized) return;
    
    // Focus the dialog
    focusDialog(dialogId);
    
    // Get current size
    if (dialogRef.current) {
      const rect = dialogRef.current.getBoundingClientRect();
      startSizeRef.current = { width: rect.width, height: rect.height };
    }
    
    // Set resize state
    setIsResizing(true);
    setResizeDirection(direction);
    resizeStateRef.current = { resizing: true, direction };
    
    // Add event listeners
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };
  
  // Handle resize movement
  const handleResizeMove = (e: MouseEvent) => {
    if (!resizeStateRef.current.resizing || !dialogRef.current) return;
    
    e.preventDefault();
    
    const direction = resizeStateRef.current.direction;
    const rect = dialogRef.current.getBoundingClientRect();
    const startWidth = startSizeRef.current.width;
    const startHeight = startSizeRef.current.height;
    
    let newWidth = startWidth;
    let newHeight = startHeight;
    
    // Calculate new size based on direction
    if (direction?.includes('e')) {
      // East/right edge
      newWidth = Math.max(200, e.clientX - rect.left);
    }
    
    if (direction?.includes('s')) {
      // South/bottom edge
      newHeight = Math.max(150, e.clientY - rect.top);
    }
    
    if (direction?.includes('w')) {
      // West/left edge
      const diff = rect.left - e.clientX;
      newWidth = Math.max(200, startWidth + diff);
    }
    
    if (direction?.includes('n')) {
      // North/top edge
      const diff = rect.top - e.clientY;
      newHeight = Math.max(150, startHeight + diff);
    }
    
    // Update size
    setSize({
      width: newWidth,
      height: newHeight
    });
    
    // For immediate visual feedback, update the style directly
    if (dialogRef.current) {
      dialogRef.current.style.width = `${newWidth}px`;
      dialogRef.current.style.height = `${newHeight}px`;
    }
  };
  
  // Handle end of resize
  const handleResizeEnd = (e: MouseEvent) => {
    e.preventDefault();
    
    setIsResizing(false);
    setResizeDirection(null);
    resizeStateRef.current = { resizing: false, direction: null };
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };
  
  // Use position style based on dialog position state
  const dialogStyle = (() => {
    // If minimized, hide the dialog completely
    if (isMinimized) {
      return {
        zIndex,
        display: 'none',  // Hide it completely when minimized
        visibility: 'hidden' as const
      };
    }
    
    // If maximized, fill the screen
    if (dialogData?.maximized) {
      return {
        zIndex,
        left: '0',
        top: '0',
        right: '0',
        bottom: '0',
        width: '100vw',
        height: 'calc(100vh - 48px)', // Subtract taskbar height
        transform: 'none',
        borderRadius: '0',
        transition: 'all 0.2s ease'
      };
    }
    
    // Not yet positioned or dragged - use default centered positioning
    if (position === null) {
      return {
        zIndex,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        ...(size && {
          width: typeof size.width === 'number' ? `${size.width}px` : size.width,
          height: typeof size.height === 'number' ? `${size.height}px` : size.height
        })
      };
    }
    
    // Positioned by dragging
    return {
      zIndex,
      left: `${position.x}px`,
      top: `${position.y}px`,
      transform: 'none',
      transition: isDragging ? 'none' : 'left 0.1s, top 0.1s',
      ...(size && {
        width: typeof size.width === 'number' ? `${size.width}px` : size.width,
        height: typeof size.height === 'number' ? `${size.height}px` : size.height
      })
    };
  })();
  
  console.log(`[${dialogId}] Render with style:`, dialogStyle, `isDragging=${isDragging}, position=`, position);
  
  // Update pointer down handler to check for interactive elements
  const handlePointerDown = (e: React.PointerEvent) => {
    // Get the target element
    const target = e.target as HTMLElement;
    
    // Don't intercept events on interactive elements (buttons, inputs, etc.)
    if (
      target.tagName === 'BUTTON' || 
      target.tagName === 'A' || 
      target.tagName === 'INPUT' || 
      target.closest('button') || 
      target.closest('a') ||
      target.closest('input') ||
      target.closest('[role="button"]') ||
      target.closest('[data-drag-handle]')
    ) {
      console.log(`[${dialogId}] Pointer down on interactive element, NOT intercepting`, target.tagName);
      // Don't focus dialog for interactive elements, let them handle their own events
      return;
    }
    
    // Capture all pointer events on non-interactive elements
    console.log(`[${dialogId}] Dialog content pointer down on non-interactive element:`, target.tagName);
    
    // Focus the dialog for non-interactive elements
    focusDialog(dialogId);
  };
  
  // Add a useEffect to handle focusing when clicked
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const dialogElement = dialogRef.current;
      if (!dialogElement) return;
      
      // First check if the click target is inside our dialog
      const wasClickInside = dialogElement.contains(e.target as Node);
      
      // Also check if the click was on the taskbar
      const wasTaskbarClick = isTaskbarElement(e.target as Node);
      
      if (wasClickInside) {
        // If it's inside and we're not active, focus the dialog
        if (!isActive && !dragStateRef.current.dragging) {
          console.log(`[${dialogId}] Global click detected inside dialog, focusing`);
          focusDialog(dialogId);
        }
      } else if (wasTaskbarClick) {
        // If the click was on the taskbar, prevent closing
        console.log(`[${dialogId}] Click detected on taskbar, ignoring`);
        // Don't do anything - we don't want to close or change focus
      } else {
        // If the click was outside and not on the taskbar, log but don't close
        console.log(`[${dialogId}] Global click detected outside dialog, but not closing automatically`);
      }
    };
    
    // Add the global click handler
    document.addEventListener('click', handleGlobalClick, { capture: true });
    
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, [dialogId, isActive, focusDialog]);
  
  // Add logging to help debug state issues
  useEffect(() => {
    if (dialogData) {
      console.log(`[${dialogId}] Dialog data updated:`, {
        isActive,
        isMinimized,
        isMaximized,
        position: dialogData.position,
        size: dialogData.size
      });
    }
  }, [dialogData, dialogId, isActive, isMinimized, isMaximized]);
  
  // In the StandaloneDialogContent component, just before returning the JSX
  // Add debugging logic
  useEffect(() => {
    console.log(`[DEBUG] StandaloneDialogContent for ${dialogId} render cycle:`, {
      isActive,
      isMinimized,
      isMaximized,
      hasDialogRef: !!dialogRef.current,
      position,
      size,
    });
    
    if (dialogRef.current) {
      console.log(`[DEBUG] DOM element for ${dialogId}:`, {
        dataState: dialogRef.current.getAttribute('data-state'),
        dataMinimized: dialogRef.current.getAttribute('data-minimized'),
        dataMaximized: dialogRef.current.getAttribute('data-maximized'),
        display: window.getComputedStyle(dialogRef.current).display,
        visibility: window.getComputedStyle(dialogRef.current).visibility,
      });
      
      // Get the content div (which might be hidden)
      const contentDiv = dialogRef.current.querySelector('[class*="pt-4"]');
      if (contentDiv) {
        console.log(`[DEBUG] Content div for ${dialogId}:`, {
          display: window.getComputedStyle(contentDiv as HTMLElement).display,
          visibility: window.getComputedStyle(contentDiv as HTMLElement).visibility,
          className: (contentDiv as HTMLElement).className,
        });
      } else {
        console.warn(`[DEBUG] No content div found for ${dialogId}`);
      }
    }
  }, [dialogId, isActive, isMinimized, isMaximized, position, size]);
  
  return (
    <ImprovedDialogInternalContext.Provider value={{ inRadixDialog: false }}>
      <Fragment>
        {/* Overlay is only shown when not minimized */}
        {!isMinimized && (
          <div 
            aria-hidden="true"
            className={cn(
              "fixed inset-0 bg-black/10",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            )}
            style={{ 
              zIndex: zIndex - 1,
              pointerEvents: 'none' // Never capture any pointer events
            }} 
            data-overlay-for={dialogId}
          />
        )}
        
        <div
          ref={(node) => {
            // Handle both refs
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
            dialogRef.current = node;
          }}
          data-dialog-id={dialogId}
          data-state={isActive ? 'active' : 'inactive'}
          data-minimized={isMinimized}
          data-maximized={isMaximized}
          tabIndex={-1} // Make the dialog focusable
          onPointerDown={handlePointerDown}
          onClick={(e) => {
            // Only handle click if not on interactive element
            const target = e.target as HTMLElement;
            if (
              target.tagName === 'BUTTON' || 
              target.tagName === 'A' || 
              target.tagName === 'INPUT' || 
              target.closest('button') || 
              target.closest('a') ||
              target.closest('input') ||
              target.closest('[role="button"]')
            ) {
              console.log(`[${dialogId}] Click on interactive element, not handling`, target.tagName);
              return;
            }
            
            console.log(`[${dialogId}] Dialog content DIRECT click on non-interactive element`);
            handleContentClick(e);
          }}
          className={cn(
            "fixed z-50",
            isDragging ? "cursor-grabbing" : "cursor-auto",
            isResizing ? "pointer-events-none" : "pointer-events-auto",
            "grid gap-4 border bg-background p-6 shadow-lg",
            "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "sm:rounded-lg",
            // Active/inactive styling with stronger visual distinction
            isActive ? "ring-2 ring-ring shadow-lg" : "ring-1 ring-muted opacity-90 shadow-md",
            // For minimized state
            isMinimized ? "min-h-0 min-w-0 w-auto" : "w-full max-w-lg",
            // For maximized state
            isMaximized ? "rounded-none max-w-none" : "",
            className
          )}
          style={{
            ...dialogStyle, 
            pointerEvents: 'auto', // Explicitly enable pointer events for dialog content
          }}
          aria-modal="true"
          role="dialog"
          {...props}
        >
          {draggable && (
            <div 
              className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between cursor-grab bg-muted/30 rounded-t-lg hover:bg-muted/50"
              onMouseDown={handleDragStart}
              onTouchStart={handleTouchStart}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              data-drag-handle="true"
            >
              <div className="flex items-center">
                <GripVertical className="h-4 w-4 ml-2 text-muted-foreground" />
                <span className={cn(
                  "text-xs ml-1",
                  isMinimized ? "font-medium text-foreground" : "text-muted-foreground"
                )}>
                  {isMinimized ? `Window: ${dialogId}` : 'Drag here'}
                </span>
              </div>
              
              <div className="flex items-center space-x-1 mr-2">
                {/* Minimize button */}
                <span 
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    minimizeDialog(dialogId, !isMinimized);
                  }}
                  aria-label={isMinimized ? "Restore" : "Minimize"}
                  title={isMinimized ? "Restore" : "Minimize"}
                  role="button"
                  tabIndex={0}
                >
                  <Minus className="h-4 w-4" />
                </span>
                
                {/* Maximize/Restore button */}
                <span 
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default button behavior
                    e.stopPropagation(); // Stop propagation to prevent parent handlers
                    
                    try {
                      console.log(`[StandaloneDialog] Toggling maximize for ${dialogId}, current maximized state: ${isMaximized}`);
                      // Use a longer delay to ensure React state updates before maximizing
                      setTimeout(() => {
                        maximizeDialog(dialogId, !isMaximized);
                        // Focus the dialog again to make sure it stays active
                        setTimeout(() => {
                          focusDialog(dialogId);
                        }, 50);
                      }, 50);
                    } catch (err) {
                      console.error(`[StandaloneDialog] Error maximizing dialog ${dialogId}:`, err);
                    }
                    
                    // Stop event from bubbling up completely
                    return false;
                  }}
                  aria-label={isMaximized ? "Restore" : "Maximize"}
                  title={isMaximized ? "Restore" : "Maximize"}
                  role="button"
                  tabIndex={0}
                >
                  {isMaximized ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </span>
                
                {/* Close button (if enabled) */}
                {showCloseButton && (
                  <DialogPrimitive.Close 
                    className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeDialog(dialogId);
                    }}
                    aria-label="Close"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </DialogPrimitive.Close>
                )}
              </div>
            </div>
          )}
          
          {/* Content is ALWAYS shown regardless of minimized state - FORCE VISIBLE */}
          <div 
            className={cn(
              draggable ? "pt-4" : "",
              "block !visible"  // Force visible with !important-like syntax
            )}
            style={{
              display: 'block !important', 
              visibility: 'visible' as const,
              opacity: 1,
              height: 'auto',
              minHeight: '100px',
              overflow: 'visible',
            }}
          >
            <div style={{ padding: '8px', border: '1px dashed #ccc' }}>
              {/* Extra wrapper to ensure content is visible */}
              {children}
            </div>
          </div>
          
          {/* Add resize handlers */}
          {!isMinimized && !isMaximized && (
            <>
              {/* Right edge */}
              <div
                className="absolute right-0 top-8 bottom-0 w-2 cursor-e-resize"
                onMouseDown={(e) => handleResizeStart(e, 'e')}
              />
              
              {/* Bottom edge */}
              <div
                className="absolute left-0 right-0 bottom-0 h-2 cursor-s-resize"
                onMouseDown={(e) => handleResizeStart(e, 's')}
              />
              
              {/* Bottom-right corner */}
              <div
                className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize"
                onMouseDown={(e) => handleResizeStart(e, 'se')}
              />
            </>
          )}
        </div>
      </Fragment>
    </ImprovedDialogInternalContext.Provider>
  );
});
StandaloneDialogContent.displayName = 'StandaloneDialogContent';

// ImprovedDialogContent with fixed click handling
export const ImprovedDialogContent = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ImprovedDialogContentProps
>(({ className, children, dialogId, showCloseButton = true, draggable = true, ...props }, ref) => {
  const { getDialogZIndex, getDialogData, focusDialog, closeDialog, minimizeDialog } = useImprovedDialog();
  
  const dialogData = getDialogData(dialogId);
  const zIndex = getDialogZIndex(dialogId);
  const isActive = dialogData?.isActive || false;
  const isMinimized = dialogData?.minimized || false;
  
  // Use the internal context to check if we're inside a Radix Dialog
  const { inRadixDialog } = useContext(ImprovedDialogInternalContext);
  
  // State for draggable position
  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs
  const dialogRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragStateRef = useRef({ dragging: false });
  
  // Focus handling when clicked
  const handleContentClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent double-handling
    e.stopPropagation();
    
    // Don't handle clicks during drag operations
    if (dragStateRef.current.dragging) {
      console.log(`[${dialogId}] Ignoring Radix click during drag operation`);
      return;
    }
    
    console.log(`[${dialogId}] Radix Dialog clicked, isActive=${isActive}`);
    
    // Always focus the dialog when it's clicked, even if it's already active
    // This ensures consistent behavior when users click between multiple dialogs
    focusDialog(dialogId);
    console.log(`[${dialogId}] Radix Dialog focused after click`);
  };
  
  // Handle the start of dragging
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggable || !dialogRef.current) {
      console.log(`[${dialogId}] RADIX DRAG START FAILED: draggable=${draggable}, dialogRef.current=${!!dialogRef.current}`);
      return;
    }
    
    // Prevent default behaviors
    e.preventDefault();
    
    // Focus the dialog
    focusDialog(dialogId);
    
    // Get current dialog position
    const rect = dialogRef.current.getBoundingClientRect();
    console.log(`[${dialogId}] RADIX DRAG START: Dialog rect=`, {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      mouseX: e.clientX,
      mouseY: e.clientY
    });
    
    // Calculate the offset of the mouse from the dialog's corner
    let offsetX, offsetY;
    if (position === null) {
      // For first drag, calculate the offset from the actual element position
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      console.log(`[${dialogId}] RADIX DRAG START: First drag, using rect offset`, { offsetX, offsetY });
    } else {
      // For subsequent drags, use the stored position
      offsetX = e.clientX - position.x;
      offsetY = e.clientY - position.y;
      console.log(`[${dialogId}] RADIX DRAG START: Subsequent drag, using position offset`, { 
        offsetX, 
        offsetY, 
        positionX: position.x, 
        positionY: position.y 
      });
    }
    
    // Store the offset for use during drag
    offsetRef.current = { x: offsetX, y: offsetY };
    
    // Set dragging flag in both state and ref
    dragStateRef.current.dragging = true;
    setIsDragging(true);
    
    console.log(`[${dialogId}] RADIX DRAG START: Adding move/end listeners`);
    
    // Add document level event listeners for move and end
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };
  
  // Handle drag movement
  const handleDragMove = (e: MouseEvent) => {
    if (!dragStateRef.current.dragging || !dialogRef.current) {
      console.log(`[${dialogId}] RADIX DRAG MOVE SKIPPED: dragging=${dragStateRef.current.dragging}, dialogRef=${!!dialogRef.current}`);
      return;
    }
    
    // Calculate new position
    const newX = e.clientX - offsetRef.current.x;
    const newY = e.clientY - offsetRef.current.y;
    
    // Get dialog dimensions
    const rect = dialogRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;
    
    // Set new position
    const finalX = Math.max(0, Math.min(newX, maxX));
    const finalY = Math.max(0, Math.min(newY, maxY));
    
    console.log(`[${dialogId}] RADIX DRAG MOVE:`, {
      mouseX: e.clientX,
      mouseY: e.clientY,
      offsetX: offsetRef.current.x,
      offsetY: offsetRef.current.y,
      newX,
      newY,
      finalX,
      finalY,
      dialogWidth: rect.width,
      dialogHeight: rect.height
    });
    
    // For immediate visual feedback, update the style directly
    if (dialogRef.current) {
      dialogRef.current.style.left = `${finalX}px`;
      dialogRef.current.style.top = `${finalY}px`;
      dialogRef.current.style.transform = 'none';
      dialogRef.current.style.transition = 'none';
      
      // Add a grab cursor to the whole dialog during dragging
      dialogRef.current.style.cursor = 'grabbing';
    }
    
    // Update state for persistence
    setPosition({ x: finalX, y: finalY });
  };
  
  // Handle end of dragging
  const handleDragEnd = (e: MouseEvent) => {
    console.log(`[${dialogId}] RADIX DRAG END at`, { x: e.clientX, y: e.clientY });
    
    // Reset dragging flag in both state and ref
    dragStateRef.current.dragging = false;
    setIsDragging(false);
    
    // Reset cursor
    if (dialogRef.current) {
      dialogRef.current.style.cursor = 'auto';
    }
    
    // Clean up document level event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    
    console.log(`[${dialogId}] RADIX DRAG END: Removed move/end listeners`);
  };
  
  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      console.log(`[${dialogId}] Radix Dialog unmounting, cleaning up listeners`);
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [dialogId]);
  
  // Handle touch events
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggable || !dialogRef.current || e.touches.length !== 1) {
      console.log(`[${dialogId}] RADIX TOUCH START FAILED: draggable=${draggable}, touches=${e.touches.length}`);
      return;
    }
    
    e.preventDefault();
    const touch = e.touches[0];
    console.log(`[${dialogId}] RADIX TOUCH START at`, { x: touch.clientX, y: touch.clientY });
    
    // Create a synthetic mouse event
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => {},
      stopPropagation: () => {}
    } as unknown as React.MouseEvent<HTMLDivElement>;
    
    handleDragStart(mouseEvent);
    
    // Add specific touch handlers
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    console.log(`[${dialogId}] RADIX TOUCH START: Added move/end listeners`);
  };
  
  // Handle touch movement
  const handleTouchMove = (e: TouchEvent) => {
    if (!dragStateRef.current.dragging || e.touches.length !== 1) return;
    e.preventDefault(); // Prevent scrolling during drag
    
    const touch = e.touches[0];
    
    // Create a synthetic mouse event
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    handleDragMove(mouseEvent);
  };
  
  // Handle touch end
  const handleTouchEnd = (e: TouchEvent) => {
    const touch = e.changedTouches[0];
    
    // Create a synthetic mouse event
    const mouseEvent = new MouseEvent('mouseup', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    handleDragEnd(mouseEvent);
    
    // Clean up touch handlers
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    
    console.log(`[${dialogId}] RADIX TOUCH END: Removed move/end listeners`);
  };
  
  // Use position style based on dialog position state
  const dialogStyle = (() => {
    // If minimized, hide the dialog completely
    if (isMinimized) {
      return {
        zIndex,
        display: 'none',  // Hide it completely when minimized
        visibility: 'hidden' as const
      };
    }
    
    // If maximized, fill the screen
    if (dialogData?.maximized) {
      return {
        zIndex,
        left: '0',
        top: '0',
        right: '0',
        bottom: '0',
        width: '100vw',
        height: 'calc(100vh - 48px)', // Subtract taskbar height
        transform: 'none',
        borderRadius: '0',
        transition: 'all 0.2s ease'
      };
    }
    
    // Not yet positioned or dragged - use default centered positioning
    if (position === null) {
      return {
        zIndex,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }
    
    // Positioned by dragging
    return {
      zIndex,
      left: `${position.x}px`,
      top: `${position.y}px`,
      transform: 'none',
      transition: isDragging ? 'none' : 'left 0.1s, top 0.1s'
    };
  })();
  
  console.log(`[${dialogId}] Radix Render with style:`, dialogStyle, `isDragging=${isDragging}, position=`, position);
  
  // Update pointer down handler to check for interactive elements
  const handlePointerDown = (e: React.PointerEvent) => {
    // Get the target element
    const target = e.target as HTMLElement;
    
    // Don't intercept events on interactive elements (buttons, inputs, etc.)
    if (
      target.tagName === 'BUTTON' || 
      target.tagName === 'A' || 
      target.tagName === 'INPUT' || 
      target.closest('button') || 
      target.closest('a') ||
      target.closest('input') ||
      target.closest('[role="button"]') ||
      target.closest('[data-drag-handle]')
    ) {
      console.log(`[${dialogId}] Radix pointer down on interactive element, NOT intercepting`, target.tagName);
      // Don't focus dialog for interactive elements, let them handle their own events
      return;
    }
    
    // Capture all pointer events on non-interactive elements
    console.log(`[${dialogId}] Radix dialog content pointer down on non-interactive element:`, target.tagName);
    
    // Focus the dialog for non-interactive elements
    focusDialog(dialogId);
  };
  
  // Add a useEffect to handle focusing when clicked
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const dialogElement = dialogRef.current;
      if (!dialogElement) return;
      
      // First check if the click target is inside our dialog
      const wasClickInside = dialogElement.contains(e.target as Node);
      
      // Also check if the click was on the taskbar
      const wasTaskbarClick = isTaskbarElement(e.target as Node);
      
      if (wasClickInside) {
        // If it's inside and we're not active, focus the dialog
        if (!isActive && !dragStateRef.current.dragging) {
          console.log(`[${dialogId}] Global click detected inside dialog, focusing`);
          focusDialog(dialogId);
        }
      } else if (wasTaskbarClick) {
        // If the click was on the taskbar, prevent closing
        console.log(`[${dialogId}] Click detected on taskbar, ignoring`);
        // Don't do anything - we don't want to close or change focus
      } else {
        // If the click was outside and not on the taskbar, log but don't close
        console.log(`[${dialogId}] Global click detected outside dialog, but not closing automatically`);
      }
    };
    
    // Add the global click handler
    document.addEventListener('click', handleGlobalClick, { capture: true });
    
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, [dialogId, isActive, focusDialog]);
  
  // Determine if we should use the Radix Portal or our custom implementation
  if (dialogData && !inRadixDialog) {
    console.log(`[${dialogId}] Using StandaloneDialogContent (not in Radix Dialog context)`);
    // When used imperatively without a Dialog context, use our custom implementation
    return (
      <StandaloneDialogContent
        ref={ref as React.Ref<HTMLDivElement>}
        dialogId={dialogId}
        className={className}
        showCloseButton={showCloseButton}
        draggable={draggable}
        {...props}
      >
        {children}
      </StandaloneDialogContent>
    );
  }
  
  console.log(`[${dialogId}] Using Radix Dialog Portal (in Radix Dialog context)`);
  // When used with a Dialog context, use the Radix Portal
  return (
    <DialogPrimitive.Portal>
      {/* Overlay is only shown when not minimized */}
      {!isMinimized && (
        <div 
          aria-hidden="true"
          className={cn(
            "fixed inset-0 bg-black/10",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
          style={{ 
            zIndex: zIndex - 1,
            pointerEvents: 'none' // Never capture any pointer events
          }} 
          data-overlay-for={dialogId}
        />
      )}
      
      <DialogPrimitive.Content
        ref={(node) => {
          // Handle the ref from React
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
          
          // Also store in our local ref
          if (node) dialogRef.current = node as HTMLDivElement;
        }}
        data-dialog-id={dialogId}
        tabIndex={-1} // Make the dialog focusable
        onPointerDown={handlePointerDown}
        onClick={(e) => {
          // Only handle click if not on interactive element
          const target = e.target as HTMLElement;
          if (
            target.tagName === 'BUTTON' || 
            target.tagName === 'A' || 
            target.tagName === 'INPUT' || 
            target.closest('button') || 
            target.closest('a') ||
            target.closest('input') ||
            target.closest('[role="button"]')
          ) {
            console.log(`[${dialogId}] Radix click on interactive element, not handling`, target.tagName);
            return;
          }
          
          console.log(`[${dialogId}] Radix dialog content DIRECT click on non-interactive element`);
          handleContentClick(e);
          e.stopPropagation();
        }}
        className={cn(
          "fixed z-50",
          isDragging ? "cursor-grabbing" : "cursor-auto",
          "grid gap-4 border bg-background p-6 shadow-lg",
          "sm:rounded-lg",
          // Active/inactive styling with stronger visual distinction
          isActive ? "ring-2 ring-ring shadow-lg" : "ring-1 ring-muted opacity-90 shadow-md",
          // For minimized state
          isMinimized ? "min-h-0 min-w-0 w-auto" : "w-full max-w-lg",
          className
        )}
        style={{
          ...dialogStyle, 
          pointerEvents: 'auto', // Explicitly enable pointer events for dialog content
        }}
        aria-modal="true"
        {...props}
      >
        {draggable && (
          <div 
            className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center cursor-grab bg-muted/30 rounded-t-lg hover:bg-muted/50"
            onMouseDown={handleDragStart}
            onTouchStart={handleTouchStart}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            data-drag-handle="true"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className={cn(
              "text-xs ml-1",
              isMinimized ? "font-medium text-foreground" : "text-muted-foreground"
            )}>
              {isMinimized ? `Window: ${dialogId}` : 'Drag here'}
            </span>
          </div>
        )}
        
        {/* Content is ALWAYS shown regardless of minimized state - FORCE VISIBLE */}
        <div 
          className={cn(
            draggable ? "pt-4" : "",
            "block !visible"  // Force visible with !important-like syntax
          )}
          style={{
            display: 'block !important', 
            visibility: 'visible' as const,
            opacity: 1,
            height: 'auto',
            minHeight: '100px',
            overflow: 'visible',
          }}
        >
          <div style={{ padding: '8px', border: '1px dashed #ccc' }}>
            {/* Extra wrapper to ensure content is visible */}
            {children}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="absolute right-4 top-3 flex items-center space-x-1">
          {/* Minimize/Restore button */}
          <span 
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              minimizeDialog(dialogId, !isMinimized);
            }}
            aria-label={isMinimized ? "Restore" : "Minimize"}
            title={isMinimized ? "Restore" : "Minimize"}
            role="button"
            tabIndex={0}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minus className="h-4 w-4" />
            )}
          </span>
          
          {/* Close button (if enabled) */}
          {showCloseButton && (
            <DialogPrimitive.Close 
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                closeDialog(dialogId);
              }}
              aria-label="Close"
              title="Close"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
ImprovedDialogContent.displayName = 'ImprovedDialogContent';

// Standalone header component
const StandaloneDialogHeader = ({
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
StandaloneDialogHeader.displayName = "StandaloneDialogHeader";

// Dialog header component - works in both contexts
export const ImprovedDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { inRadixDialog } = useContext(ImprovedDialogInternalContext);
  
  // Always render our own div - it's just styling
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className
      )}
      {...props}
    />
  );
};
ImprovedDialogHeader.displayName = "ImprovedDialogHeader";

// Standalone footer component
const StandaloneDialogFooter = ({
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
StandaloneDialogFooter.displayName = "StandaloneDialogFooter";

// Dialog footer component - works in both contexts
export const ImprovedDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  // Always render our own div - it's just styling
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  );
};
ImprovedDialogFooter.displayName = "ImprovedDialogFooter";

// Standalone title component
const StandaloneDialogTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
StandaloneDialogTitle.displayName = "StandaloneDialogTitle";

// Dialog title component
export const ImprovedDialogTitle = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => {
  const { inRadixDialog } = useContext(ImprovedDialogInternalContext);
  
  if (!inRadixDialog) {
    return (
      <StandaloneDialogTitle
        ref={ref as React.Ref<HTMLHeadingElement>}
        className={className}
        {...props}
      />
    );
  }
  
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  );
});
ImprovedDialogTitle.displayName = "ImprovedDialogTitle";

// Standalone description component
const StandaloneDialogDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
StandaloneDialogDescription.displayName = "StandaloneDialogDescription";

// Dialog description component
export const ImprovedDialogDescription = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  const { inRadixDialog } = useContext(ImprovedDialogInternalContext);
  
  if (!inRadixDialog) {
    return (
      <StandaloneDialogDescription
        ref={ref as React.Ref<HTMLParagraphElement>}
        className={className}
        {...props}
      />
    );
  }
  
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
ImprovedDialogDescription.displayName = "ImprovedDialogDescription";

// Dialog container component - renders all active dialogs
export const ImprovedDialogContainer = () => {
  const { openDialogs } = useImprovedDialog();
  
  if (openDialogs.length === 0) return null;
  
  return (
    <div className="improved-dialog-container">
      {openDialogs.map((dialog) => (
        <div key={dialog.id}>{dialog.component}</div>
      ))}
    </div>
  );
};

// Add this function before the ImprovedDialogContent component
// Function to reliably identify taskbar elements
const isTaskbarElement = (element: Node | null): boolean => {
  if (!element) return false;
  
  // Walk up the tree to find a possible taskbar element
  let current: Node | null = element;
  while (current && current !== document.body) {
    if (current instanceof HTMLElement) {
      // Check if this is part of the taskbar
      if (current.classList.contains('dialog-taskbar') ||
          current.getAttribute('role') === 'dialog-taskbar' ||
          current.getAttribute('data-taskbar') === 'true') {
        return true;
      }
    }
    current = current.parentNode;
  }
  return false;
}; 