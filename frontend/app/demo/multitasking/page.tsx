'use client';

import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ImprovedDialogProvider, useImprovedDialog } from '@/lib/contexts/ImprovedDialogContext';
import { 
  ImprovedDialogRoot, 
  ImprovedDialogTrigger, 
  ImprovedDialogContent, 
  ImprovedDialogHeader, 
  ImprovedDialogTitle, 
  ImprovedDialogDescription 
} from '@/components/ui/improved-dialog';
import { DialogTaskbar } from '@/components/ui/dialog-taskbar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

// Add this basic dialog component at the top
function BasicDialog({ id, title, isOpen, onClose, children }: { 
  id: string; 
  title: string; 
  isOpen: boolean; 
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div 
        className="relative bg-background border rounded-lg shadow-lg p-4 max-w-lg w-full" 
        style={{ 
          zIndex: 51,
          minHeight: "300px",
          display: "block"
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

// Helper component to open dialogs without using the ImprovedDialog system
function SimpleDialogOpener({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <div className="flex flex-col space-y-1">
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        {title}
      </Button>
      
      <BasicDialog 
        id={id} 
        title={title} 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
      >
        {children}
      </BasicDialog>
    </div>
  );
}

// Main content component
function MultitaskingDemoContent() {
  const { openDialogs } = useImprovedDialog();
  
  // Log open dialogs for debugging
  useEffect(() => {
    console.log('Current open dialogs:', 
      openDialogs.map(dialog => ({
        id: dialog.id,
        isActive: dialog.isActive,
        minimized: dialog.minimized,
        maximized: dialog.maximized,
        zIndex: dialog.zIndex
      }))
    );
  }, [openDialogs]);
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Dialog Multitasking Demo</h1>
      <p className="text-lg mb-8">
        This demo showcases a Windows-like multitasking system with multiple dialogs that can be:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Open multiple dialogs simultaneously</li>
              <li>Drag dialogs to reposition them</li>
              <li>Minimize dialogs to the taskbar</li>
              <li>Focus management between dialogs</li>
              <li>Z-index management for proper stacking</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Open Dialogs</CardTitle>
            <CardDescription>Click the buttons below to open different types of dialogs</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <EnhancedDialogOpener id="notes-dialog" title="Notes">
              <NotesDialogContent />
            </EnhancedDialogOpener>
            
            <EnhancedDialogOpener id="calendar-dialog" title="Calendar">
              <CalendarDialogContent />
            </EnhancedDialogOpener>
            
            <EnhancedDialogOpener id="contacts-dialog" title="Contacts">
              <ContactsDialogContent />
            </EnhancedDialogOpener>
            
            <EnhancedDialogOpener id="settings-dialog" title="Settings">
              <SettingsDialogContent />
            </EnhancedDialogOpener>
            
            <EnhancedDialogOpener id="help-dialog" title="Help">
              <HelpDialogContent />
            </EnhancedDialogOpener>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Try opening multiple dialogs and interact with them to experience the multitasking capabilities:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Click and drag the top bar of any dialog to move it around</li>
            <li>Click the minimize button to collapse the dialog to the taskbar</li>
            <li>Click on a dialog to bring it to the front</li>
            <li>Click on a minimized dialog in the taskbar to restore it</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// Default export with provider wrapper
export default function MultitaskingDemo() {
  return (
    <ImprovedDialogProvider>
      <MultitaskingDemoContent />
      <DialogTaskbar />
    </ImprovedDialogProvider>
  );
}

// Dialog content components
function NotesDialogContent() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="Note title" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea id="content" placeholder="Write your notes here..." className="min-h-[200px]" />
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </div>
    </div>
  );
}

function CalendarDialogContent() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  
  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border mx-auto"
      />
      <div className="pt-4 border-t">
        <h3 className="font-medium">Selected Date:</h3>
        <p>{date ? date.toDateString() : 'None'}</p>
      </div>
    </div>
  );
}

function ContactsDialogContent() {
  const contacts = [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '(555) 123-4567' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '(555) 987-6543' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '(555) 456-7890' },
    { id: 4, name: 'Alice Williams', email: 'alice@example.com', phone: '(555) 234-5678' },
    { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', phone: '(555) 876-5432' },
  ];
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="search">Search Contacts</Label>
        <Input id="search" placeholder="Type a name..." />
      </div>
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="p-4">
                <div className="font-medium">{contact.name}</div>
                <div className="text-sm text-muted-foreground">{contact.email}</div>
                <div className="text-sm text-muted-foreground">{contact.phone}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function SettingsDialogContent() {
  return (
    <Tabs defaultValue="general">
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" defaultValue="user123" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" defaultValue="user@example.com" />
        </div>
        <Button>Save Changes</Button>
      </TabsContent>
      <TabsContent value="appearance" className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Theme</Label>
          <div className="flex space-x-2">
            <Button variant="outline">Light</Button>
            <Button variant="outline">Dark</Button>
            <Button variant="outline">System</Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Font Size</Label>
          <div className="flex space-x-2">
            <Button variant="outline">Small</Button>
            <Button variant="outline">Medium</Button>
            <Button variant="outline">Large</Button>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="notifications" className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Email Notifications</Label>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="email-notifications" className="h-4 w-4" />
            <Label htmlFor="email-notifications">Enable email notifications</Label>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Push Notifications</Label>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="push-notifications" className="h-4 w-4" />
            <Label htmlFor="push-notifications">Enable push notifications</Label>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function HelpDialogContent() {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Multitasking Dialog System Help</h3>
      <p>
        This demo showcases a Windows-like multitasking dialog system built with React and TypeScript.
        The system allows for multiple dialogs to be open simultaneously, with support for dragging,
        resizing, minimizing, and maximizing.
      </p>
      <h4 className="font-medium">Key Components:</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li><code>ImprovedDialogProvider</code>: Manages the state of all open dialogs</li>
        <li><code>ImprovedDialogRoot</code>: The main dialog component</li>
        <li><code>DialogTaskbar</code>: Displays and manages minimized dialogs</li>
      </ul>
      <h4 className="font-medium">Keyboard Shortcuts:</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>Esc</div><div>Close active dialog</div>
        <div>Alt+Tab</div><div>Cycle between dialogs</div>
        <div>Alt+Space</div><div>Open dialog menu</div>
      </div>
    </div>
  );
}

// Add this enhanced dialog component that supports dragging
function DraggableDialog({ id, title, isOpen, onClose, children }: { 
  id: string; 
  title: string; 
  isOpen: boolean; 
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { minimizeDialog, openDialog } = useImprovedDialog();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  
  // Register dialog with the context when it opens
  useEffect(() => {
    if (isOpen) {
      // Create direct dialog content
      const content = (
        <div className="p-4">{children}</div>
      );
      
      // Register with the dialog context
      openDialog(id, content);
      console.log(`Registered dialog ${id} with context`);
    }
  }, [id, isOpen, children, openDialog]);
  
  // Add dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (dialogRef.current && e.target === dialogRef.current.querySelector('.dialog-header')) {
      setIsDragging(true);
      const rect = dialogRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dialogRef.current) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      setPosition({ x: newX, y: newY });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      ref={dialogRef}
      className="fixed z-50" 
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px` 
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      data-dialog-id={id}
    >
      <div 
        className="bg-background border rounded-lg shadow-lg" 
        style={{ 
          width: "500px",
          minHeight: "300px"
        }}
      >
        <div className="flex justify-between items-center p-4 dialog-header cursor-move bg-muted border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => minimizeDialog(id, true)}
              className="p-1 rounded-sm hover:bg-accent"
            >
              <span>_</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1 rounded-sm hover:bg-accent"
            >
              <span>✕</span>
            </button>
          </div>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// Helper component to open dialogs using the proper ImprovedDialogContent
function EnhancedDialogOpener({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const { isDialogOpen, focusDialog, minimizeDialog } = useImprovedDialog();
  
  const handleOpenDialog = () => {
    console.log(`Opening dialog ${id} with native ImprovedDialogContent`);
    
    if (isDialogOpen(id)) {
      console.log(`Dialog ${id} is already open, focusing it`);
      focusDialog(id);
      minimizeDialog(id, false);
    }
  };
  
  return (
    <div className="flex flex-col space-y-1">
      <ImprovedDialogRoot dialogId={id}>
        <ImprovedDialogTrigger asChild>
          <Button variant="outline" onClick={handleOpenDialog}>
            {title}
          </Button>
        </ImprovedDialogTrigger>
        
        <ImprovedDialogContent
          dialogId={id}
          className="min-w-[500px]"
          draggable={true}
          showCloseButton={true}
        >
          <ImprovedDialogHeader>
            <ImprovedDialogTitle>{title}</ImprovedDialogTitle>
            <ImprovedDialogDescription>
              This is a draggable and resizable dialog window
            </ImprovedDialogDescription>
          </ImprovedDialogHeader>
          <div className="p-4">
            {children}
          </div>
        </ImprovedDialogContent>
      </ImprovedDialogRoot>
      
      <Button 
        variant="secondary" 
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          if (isDialogOpen(id)) {
            minimizeDialog(id, true);
          }
        }}
      >
        {title} (Minimize)
      </Button>
    </div>
  );
} 