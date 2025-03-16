'use client';

import React, { forwardRef, useRef, useEffect, useState, ReactNode } from 'react';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMeetingDialog, MeetingDialogType } from '@/lib/contexts/MeetingDialogContext';

// Props for the MeetingDialog component
interface MeetingDialogRootProps {
  dialogId: string;
  children: React.ReactNode;
  type: MeetingDialogType;
  className?: string;
  meeting?: any;
  leadId?: number;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Root dialog component
export const MeetingDialogRoot = ({
  dialogId,
  type,
  children,
  className,
  meeting,
  leadId,
  defaultOpen = false,
  onOpenChange,
}: MeetingDialogRootProps) => {
  const { isMeetingDialogOpen, openMeetingDialog, closeMeetingDialog } = useMeetingDialog();
  const [initialized, setInitialized] = useState(false);
  const isOpen = isMeetingDialogOpen(dialogId);

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
        openMeetingDialog(dialogId, type, dialogContent, { meeting, leadId });
        setInitialized(true);
      }
    }
  }, [defaultOpen, dialogId, type, children, isOpen, initialized, openMeetingDialog, meeting, leadId]);

  // Handle external open/close changes
  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  }, [isOpen, onOpenChange]);

  return (
    <div data-meeting-dialog-root={dialogId} className={className}>
      {children}
    </div>
  );
};

// Trigger component
interface MeetingDialogTriggerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  dialogId: string;
  dialogType: MeetingDialogType;
  meeting?: any;
  leadId?: number;
  type?: 'button' | 'submit' | 'reset';
}

export const MeetingDialogTrigger = forwardRef<
  HTMLButtonElement,
  MeetingDialogTriggerProps
>(({ dialogId, dialogType, meeting, leadId, onClick, children, type = 'button', ...props }, ref) => {
  const { openMeetingDialog, isMeetingDialogOpen } = useMeetingDialog();
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Call the original onClick handler if it exists
    if (onClick) onClick(e);
    
    // Find the parent MeetingDialogRoot component
    let parent = e.currentTarget.closest('[data-meeting-dialog-root]');
    if (parent) {
      const rootDialogId = parent.getAttribute('data-meeting-dialog-root');
      if (rootDialogId === dialogId) {
        // Find all siblings of the current trigger that might contain our content
        const root = parent.parentElement;
        if (root) {
          // We can't use DOM elements directly with React context
          // Instead, create a new React element with the desired props
          const dialogContent = (
            <MeetingDialogContent 
              dialogId={dialogId} 
              dialogType={dialogType}
            >
              Dialog content for {dialogId}
            </MeetingDialogContent>
          );
          
          // Open the dialog with the React element
          if (!isMeetingDialogOpen(dialogId)) {
            e.stopPropagation(); // Prevent default behaviors
            openMeetingDialog(dialogId, dialogType, dialogContent, { meeting, leadId });
          }
        }
      }
    }
  };
  
  return (
    <button 
      ref={ref} 
      type={type}
      onClick={handleClick}
      {...props} 
    >
      {children}
    </button>
  );
});
MeetingDialogTrigger.displayName = 'MeetingDialogTrigger';

interface Position {
  x: number;
  y: number;
}

// Content component - this is what will be rendered for each open dialog
interface MeetingDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  dialogId: string;
  dialogType: MeetingDialogType;
  children?: React.ReactNode;
  showCloseButton?: boolean;
  draggable?: boolean;
  title?: string;
}

export const MeetingDialogContent = forwardRef<
  HTMLDivElement,
  MeetingDialogContentProps
>(({ className, children, dialogId, dialogType, showCloseButton = true, draggable = true, title, ...props }, ref) => {
  const { 
    getMeetingDialogZIndex, 
    getMeetingDialogData, 
    focusMeetingDialog, 
    closeMeetingDialog, 
    minimizeMeetingDialog, 
    maximizeMeetingDialog 
  } = useMeetingDialog();
  
  const dialogData = getMeetingDialogData(dialogId);
  const zIndex = getMeetingDialogZIndex(dialogId);
  const isActive = dialogData?.isActive || false;
  const isMinimized = dialogData?.minimized || false;
  const isMaximized = dialogData?.maximized || false;
  
  // State for draggable position
  const [position, setPosition] = useState<Position | null>(
    dialogData?.position || null
  );
  
  const [isDragging, setIsDragging] = useState(false);
  const [size, setSize] = useState<{ width: number | string, height: number | string } | null>(
    dialogData?.size || null
  );
  
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  
  // Refs
  const dialogRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragStateRef = useRef({ dragging: false });
  const resizeStateRef = useRef({ resizing: false, direction: null as string | null });
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });
  
  // Update position and size when they change in the context
  useEffect(() => {
    if (dialogData?.position && !isDragging) {
      setPosition(dialogData.position);
    }
    
    if (dialogData?.size && !isResizing) {
      setSize(dialogData.size);
    }
  }, [dialogData?.position, dialogData?.size, isDragging, isResizing]);
  
  // Focus handling when clicked
  const handleContentClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent double-handling
    e.stopPropagation();
    
    // Don't handle clicks during drag operations
    if (dragStateRef.current.dragging) {
      return;
    }
    
    // Always focus the dialog when it's clicked
    focusMeetingDialog(dialogId);
  };
  
  // Force proper positioning
  const forcePosition = (x: number, y: number) => {
    if (dialogRef.current) {
      console.log('🔨 Force position applied', { x, y, dialogId });
      dialogRef.current.style.transition = 'none';
      dialogRef.current.style.left = `${x}px`;
      dialogRef.current.style.top = `${y}px`;
      dialogRef.current.style.transform = 'none';
      dialogRef.current.style.position = 'fixed';
      
      // Force a reflow to ensure the changes take effect immediately
      void dialogRef.current.offsetHeight;
    }
  };

  // Handle the start of dragging
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log('🔍 DRAG START', { dialogId });
    
    if (!draggable || !dialogRef.current || isMaximized) {
      console.log('❌ Drag aborted - not draggable or maximized');
      return;
    }
    
    // Prevent default behaviors
    e.preventDefault();
    e.stopPropagation();
    
    // Ensure the dialog is focused
    focusMeetingDialog(dialogId);
    
    // Calculate the offset from the current mouse position to the dialog position
    const rect = dialogRef.current.getBoundingClientRect();
    
    // Force position to match current bounding rect to ensure consistent start
    forcePosition(rect.left, rect.top);
    
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    console.log('📏 Initial positions', {
      mousePosition: { x: e.clientX, y: e.clientY },
      dialogPosition: { x: rect.left, y: rect.top },
      offset: offsetRef.current
    });
    
    // Save start position for bounds checking
    startPosRef.current = {
      x: rect.left,
      y: rect.top
    };
    
    // Mark as dragging
    setIsDragging(true);
    dragStateRef.current.dragging = true;
    
    // Add event listeners for drag movement and end
    window.addEventListener('mousemove', handleDragMove, { passive: false });
    window.addEventListener('mouseup', handleDragEnd);
    
    console.log('✅ Drag initialized');
  };
  
  // Handle dragging movement
  const handleDragMove = (e: MouseEvent) => {
    console.log('🔄 DRAG MOVE', { dialogId, isDragging: dragStateRef.current.dragging });
    
    if (!dragStateRef.current.dragging || !dialogRef.current) {
      console.log('❌ Move aborted - not dragging or no ref');
      return;
    }
    
    // Prevent default to avoid text selection during drag
    e.preventDefault();
    
    // Calculate the new position based on the mouse position and offset
    let newX = e.clientX - offsetRef.current.x;
    let newY = e.clientY - offsetRef.current.y;
    
    console.log('🖱️ Mouse position', { clientX: e.clientX, clientY: e.clientY, offset: offsetRef.current });
    console.log('📍 New calculated position', { newX, newY });
    
    // Bounds checking - keep dialog within viewport
    const rect = dialogRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;
    
    // Ensure dialog stays mostly on screen
    newX = Math.max(-100, Math.min(newX, maxX + 100));
    newY = Math.max(0, Math.min(newY, maxY));
    
    const newPosition = { x: newX, y: newY };
    
    console.log('🎯 Final position after bounds check', newPosition);
    
    // Update the state to re-render the dialog at the new position
    setPosition(newPosition);
    
    // Apply position directly to the DOM element for immediate feedback
    forcePosition(newX, newY);
  };
  
  // Handle the end of dragging
  const handleDragEnd = (e: MouseEvent) => {
    console.log('⏹️ DRAG END', { dialogId });
    
    // Clean up event listeners
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
    
    // Mark as no longer dragging
    setIsDragging(false);
    dragStateRef.current.dragging = false;
    
    // Update position state once more to ensure it's saved in context
    if (dialogRef.current && position) {
      console.log('💾 Final position saved', position);
      
      // Re-enable transitions
      dialogRef.current.style.transition = '';
    }
  };
  
  // Ensure resizing state is synced between state and ref
  useEffect(() => {
    resizeStateRef.current.resizing = isResizing;
    resizeStateRef.current.direction = resizeDirection;
    console.log('🔄 Resize state updated:', { isResizing, resizeDirection, dialogId });
  }, [isResizing, resizeDirection, dialogId]);
  
  // Handle resizing
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, direction: string) => {
    console.log('📏 RESIZE START', { dialogId, direction, isMaximized });
    
    if (isMaximized) {
      console.log('❌ Resize aborted - dialog is maximized');
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    // Ensure dialog is focused
    focusMeetingDialog(dialogId);
    
    // Store starting size and mouse position
    if (dialogRef.current) {
      const rect = dialogRef.current.getBoundingClientRect();
      startSizeRef.current = {
        width: rect.width,
        height: rect.height
      };
      
      startPosRef.current = {
        x: rect.left,
        y: rect.top
      };
      
      console.log('📐 Initial size and position', { 
        startSize: startSizeRef.current,
        startPos: startPosRef.current,
        mousePos: { x: e.clientX, y: e.clientY }
      });
    }
    
    // First update the ref for immediate access in event handlers
    resizeStateRef.current.resizing = true;
    resizeStateRef.current.direction = direction;
    
    // Then update the state for component rendering
    setIsResizing(true);
    setResizeDirection(direction);
    
    // Add event listeners
    window.addEventListener('mousemove', handleResizeMove, { passive: false });
    window.addEventListener('mouseup', handleResizeEnd);
    
    console.log('✅ Resize initialized', { direction });
  };
  
  const handleResizeMove = (e: MouseEvent) => {
    console.log('🔄 RESIZE MOVE', { 
      dialogId, 
      isResizing: resizeStateRef.current.resizing, 
      direction: resizeStateRef.current.direction 
    });
    
    if (!resizeStateRef.current.resizing || !dialogRef.current || !resizeStateRef.current.direction) {
      console.log('❌ Resize move aborted - not resizing or no ref/direction');
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = dialogRef.current.getBoundingClientRect();
    
    let newWidth = startSizeRef.current.width;
    let newHeight = startSizeRef.current.height;
    let newX = startPosRef.current.x;
    let newY = startPosRef.current.y;
    
    // Calculate new dimensions based on direction
    switch(resizeStateRef.current.direction) {
      case 'e': // right edge
        newWidth = Math.max(300, e.clientX - rect.left);
        break;
      case 's': // bottom edge
        newHeight = Math.max(200, e.clientY - rect.top);
        break;
      case 'se': // bottom-right corner
        newWidth = Math.max(300, e.clientX - rect.left);
        newHeight = Math.max(200, e.clientY - rect.top);
        break;
      case 'w': // left edge
        const diffWidth = startPosRef.current.x - e.clientX;
        newWidth = Math.max(300, startSizeRef.current.width + diffWidth);
        newX = startPosRef.current.x - diffWidth;
        break;
      case 'n': // top edge
        const diffHeight = startPosRef.current.y - e.clientY;
        newHeight = Math.max(200, startSizeRef.current.height + diffHeight);
        newY = startPosRef.current.y - diffHeight;
        break;
    }
    
    console.log('📐 New dimensions calculated', {
      oldSize: { width: rect.width, height: rect.height },
      newSize: { width: newWidth, height: newHeight },
      oldPos: { x: rect.left, y: rect.top },
      newPos: { x: newX, y: newY },
      mousePos: { x: e.clientX, y: e.clientY }
    });
    
    // Update size
    setSize({
      width: newWidth,
      height: newHeight
    });
    
    // Update position if needed
    if (resizeStateRef.current.direction?.includes('w') || resizeStateRef.current.direction?.includes('n')) {
      setPosition({ x: newX, y: newY });
      
      // Update position immediately in the DOM
      dialogRef.current.style.left = `${newX}px`;
      dialogRef.current.style.top = `${newY}px`;
    }
    
    // Force the DOM update with the new dimensions for immediate feedback
    dialogRef.current.style.transition = 'none';
    dialogRef.current.style.width = `${newWidth}px`;
    dialogRef.current.style.height = `${newHeight}px`;
    
    // Force a reflow to ensure the changes take effect immediately
    void dialogRef.current.offsetHeight;
    
    console.log('💫 DOM Updated for resize', {
      width: dialogRef.current.style.width,
      height: dialogRef.current.style.height,
      left: dialogRef.current.style.left,
      top: dialogRef.current.style.top
    });
  };
  
  const handleResizeEnd = () => {
    console.log('⏹️ RESIZE END', { dialogId });
    
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
    
    resizeStateRef.current.resizing = false;
    resizeStateRef.current.direction = null;
    
    setIsResizing(false);
    setResizeDirection(null);
    
    if (dialogRef.current) {
      // Re-enable transitions
      dialogRef.current.style.transition = '';
      
      console.log('💾 Final size saved', {
        width: dialogRef.current.style.width,
        height: dialogRef.current.style.height
      });
    }
  };
  
  // Handle touch events for mobile dragging
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggable || !dialogRef.current || isMaximized) {
      return;
    }
    
    // Prevent default to avoid scrolling
    e.preventDefault();
    e.stopPropagation();
    
    // Ensure the dialog is focused
    focusMeetingDialog(dialogId);
    
    // Calculate the offset from the current touch position to the dialog position
    const rect = dialogRef.current.getBoundingClientRect();
    
    // Force position to match current bounding rect to ensure consistent start
    forcePosition(rect.left, rect.top);
    
    const touch = e.touches[0];
    offsetRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
    
    // Save start position for bounds checking
    startPosRef.current = {
      x: rect.left,
      y: rect.top
    };
    
    // Mark as dragging
    setIsDragging(true);
    dragStateRef.current.dragging = true;
    
    // Add event listeners for touch movement and end
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  };
  
  // Handle touch movement
  const handleTouchMove = (e: TouchEvent) => {
    if (!dragStateRef.current.dragging || !dialogRef.current) return;
    
    // Prevent default to stop scrolling
    e.preventDefault();
    
    // Get the first touch point
    const touch = e.touches[0];
    
    // Calculate the new position based on the touch position and offset
    let newX = touch.clientX - offsetRef.current.x;
    let newY = touch.clientY - offsetRef.current.y;
    
    // Bounds checking - keep dialog within viewport
    const rect = dialogRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;
    
    // Ensure dialog stays mostly on screen
    newX = Math.max(-100, Math.min(newX, maxX + 100));
    newY = Math.max(0, Math.min(newY, maxY));
    
    const newPosition = { x: newX, y: newY };
    
    // Update the state to re-render the dialog at the new position
    setPosition(newPosition);
    
    // Apply position directly to the DOM element for immediate feedback
    forcePosition(newX, newY);
  };
  
  // Handle the end of touch dragging
  const handleTouchEnd = (e: TouchEvent) => {
    // Clean up event listeners
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
    
    // Mark as no longer dragging
    setIsDragging(false);
    dragStateRef.current.dragging = false;
    
    // Update position state once more to ensure it's saved in context
    if (dialogRef.current && position) {
      // Re-enable transitions
      dialogRef.current.style.transition = '';
    }
  };
  
  // Debug utility
  const logDragState = () => {
    console.log('🔎 Current Drag State:', {
      dialogId,
      isDragging,
      dragStateRef: dragStateRef.current.dragging,
      position,
    });
  };
  
  // Ensure dragging state is synced between state and ref
  useEffect(() => {
    dragStateRef.current.dragging = isDragging;
    console.log('🔄 Drag state updated:', { isDragging, dialogId });
  }, [isDragging, dialogId]);
  
  // Ensure we can see mouse events on the title bar
  useEffect(() => {
    const titleBar = dialogRef.current?.querySelector('.cursor-move');
    if (titleBar) {
      const debugMouseDown = (e: Event) => {
        console.log('👇 Mouse down on title bar', { 
          dialogId, 
          event: e instanceof MouseEvent ? {
            clientX: e.clientX,
            clientY: e.clientY
          } : 'Not a MouseEvent'
        });
      };
      titleBar.addEventListener('mousedown', debugMouseDown);
      return () => titleBar.removeEventListener('mousedown', debugMouseDown);
    }
  }, [dialogId]);
  
  // Make sure we start with a force-applied position for better dragging
  useEffect(() => {
    if (dialogRef.current && position) {
      console.log('🏁 Applying initial position', { position, dialogId });
      dialogRef.current.style.left = `${position.x}px`;
      dialogRef.current.style.top = `${position.y}px`;
      dialogRef.current.style.transform = 'none';
      dialogRef.current.style.position = 'fixed';
    }
  }, [position, dialogId]);
  
  // Calculate actual position, taking into account position from context and local state
  const finalPosition = position || dialogData?.position;
  const finalSize = size || dialogData?.size;
  
  return (
    <div
      ref={dialogRef}
      className={cn(
        "fixed z-50 gap-4 bg-background p-6 shadow-lg transition-all duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg border",
        isMinimized ? "opacity-0 pointer-events-none invisible" : "opacity-100 visible",
        isMaximized && "inset-0 rounded-none",
        isActive && "ring-2 ring-ring",
        isDragging && "opacity-90 shadow-xl",
        className
      )}
      style={{
        // Do not render position/size when minimized
        ...(!isMaximized && !isMinimized && finalPosition ? {
          position: 'fixed', 
          left: `${finalPosition.x}px`, 
          top: `${finalPosition.y}px`
        } : {}),
        ...(finalSize && !isMaximized && !isMinimized ? { 
          width: typeof finalSize.width === 'number' ? `${finalSize.width}px` : finalSize.width, 
          height: typeof finalSize.height === 'number' ? `${finalSize.height}px` : finalSize.height 
        } : {}),
        // Always render z-index
        zIndex,
        // When minimized, hide completely with CSS
        ...(isMinimized ? {
          display: 'none'
        } : {})
      }}
      data-meeting-dialog-id={dialogId}
      data-active={isActive ? "true" : "false"}
      data-minimized={isMinimized ? "true" : "false"}
      data-maximized={isMaximized ? "true" : "false"}
      onClick={handleContentClick}
      onMouseDown={(e) => {
        console.log('🖱️ Mouse down on dialog', { dialogId, target: e.target });
      }}
      {...props}
    >
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 h-10 bg-muted flex items-center justify-between px-4 cursor-move rounded-t-lg",
          isDragging && "cursor-grabbing",
          !isMaximized && "hover:bg-muted/80"
        )}
        onMouseDown={handleDragStart}
        onTouchStart={handleTouchStart}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 opacity-60">
            <div className="w-1 h-3 bg-muted-foreground rounded"></div>
            <div className="w-1 h-3 bg-muted-foreground rounded"></div>
            <div className="w-1 h-3 bg-muted-foreground rounded"></div>
          </div>
          <div className="text-sm font-medium truncate max-w-[200px]">{title || `Dialog ${dialogId}`}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="rounded-full h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              console.log('🔽 Minimize button clicked', { dialogId, isMinimized });
              minimizeMeetingDialog(dialogId, true);
              console.log('🔽 After minimize call', { dialogId });
            }}
            title="Minimize"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            className="rounded-full h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => maximizeMeetingDialog(dialogId, !isMaximized)}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          {showCloseButton && (
            <button
              className="rounded-full h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => closeMeetingDialog(dialogId)}
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="pt-6">
        {children}
      </div>
      
      {/* Resize handles */}
      {!isMaximized && draggable && (
        <>
          <div 
            className="absolute right-0 top-0 bottom-0 w-4 cursor-e-resize"
            onMouseDown={(e) => {
              console.log('🖱️ Right edge resize handle clicked');
              handleResizeStart(e, 'e');
            }}
          />
          <div 
            className="absolute left-0 top-0 bottom-0 w-4 cursor-w-resize"
            onMouseDown={(e) => {
              console.log('🖱️ Left edge resize handle clicked');
              handleResizeStart(e, 'w');
            }}
          />
          <div 
            className="absolute bottom-0 left-0 right-0 h-4 cursor-s-resize"
            onMouseDown={(e) => {
              console.log('🖱️ Bottom edge resize handle clicked');
              handleResizeStart(e, 's');
            }}
          />
          <div 
            className="absolute top-0 left-0 right-0 h-4 cursor-n-resize"
            onMouseDown={(e) => {
              console.log('🖱️ Top edge resize handle clicked');
              handleResizeStart(e, 'n');
            }}
          />
          <div 
            className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
            onMouseDown={(e) => {
              console.log('🖱️ Bottom-right corner resize handle clicked');
              handleResizeStart(e, 'se');
            }}
          />
        </>
      )}
    </div>
  );
});
MeetingDialogContent.displayName = 'MeetingDialogContent';

export const MeetingDialogHeader = ({
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
MeetingDialogHeader.displayName = 'MeetingDialogHeader';

export const MeetingDialogFooter = ({
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
MeetingDialogFooter.displayName = 'MeetingDialogFooter';

export const MeetingDialogTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
);
MeetingDialogTitle.displayName = 'MeetingDialogTitle';

export const MeetingDialogDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
);
MeetingDialogDescription.displayName = 'MeetingDialogDescription';

// Container to render all open dialogs
export const MeetingDialogContainer = () => {
  const { openDialogs, getAllMeetingDialogs } = useMeetingDialog();
  
  // Re-render when dialogs change
  const dialogsToRender = getAllMeetingDialogs();
  
  return (
    <>
      {dialogsToRender.map((dialog) => (
        <React.Fragment key={dialog.id}>
          {dialog.component}
        </React.Fragment>
      ))}
    </>
  );
}; 