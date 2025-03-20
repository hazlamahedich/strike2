'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MeetingDialogContent } from '../ui/meeting-dialog';
import { MeetingDialogType } from '../../contexts/MeetingDialogContext';
import { useToast } from '../ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Phone, MessageSquare, Clock, User, Minus } from 'lucide-react';
import Dialpad from './Dialpad';
import SMSComposer from './SMSComposer';
import SMSLog from './SMSLog';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import type { SMSMessage } from '../../types/communications';
import { useLeadPhoneDialog } from '../../contexts/LeadPhoneDialogContext';
import { cn } from '@/lib/utils';

// Mock call log data - this could be replaced with real data later
const mockCallLogs = [
  {
    id: 1,
    direction: 'outbound' as const,
    duration: 120,
    caller_number: '+1234567890',
    recipient_number: '+0987654321',
    status: 'completed' as const,
    call_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    recording_url: 'https://api.twilio.com/2010-04-01/Accounts/AC123/Recordings/RE123.mp3',
    transcription: 'Hello, this is a test call. I wanted to discuss our upcoming meeting. Please call me back when you have a chance.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    direction: 'inbound' as const,
    duration: 180,
    caller_number: '+0987654321',
    recipient_number: '+1234567890',
    status: 'completed' as const,
    call_time: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    recording_url: 'https://api.twilio.com/2010-04-01/Accounts/AC123/Recordings/RE456.mp3',
    transcription: 'I received your call. I am available tomorrow at 2 PM for our meeting. Looking forward to discussing the project details.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    direction: 'outbound' as const,
    duration: 0,
    caller_number: '+1234567890',
    recipient_number: '+0987654321',
    status: 'failed' as const,
    call_time: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    recording_url: null,
    transcription: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Mock SMS logs data
const mockSMSLogs: SMSMessage[] = [
  {
    id: 1,
    direction: 'outbound',
    sender_number: '+1234567890',
    recipient_number: '+0987654321',
    body: 'Hi there! Just following up on our conversation earlier today. Let me know if you have any questions!',
    status: 'delivered',
    sent_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    direction: 'inbound',
    sender_number: '+0987654321',
    recipient_number: '+1234567890',
    body: "Thanks for following up! I'll review the proposal and get back to you tomorrow.",
    status: 'received',
    sent_at: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    direction: 'outbound',
    sender_number: '+1234567890',
    recipient_number: '+0987654321',
    body: 'Sounds good! Looking forward to your feedback.',
    status: 'delivered',
    sent_at: new Date(Date.now() - 5000000).toISOString(), // ~1.4 hours ago
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Define types for call logs
interface CallLog {
  id: number;
  direction: 'outbound' | 'inbound';
  duration: number;
  caller_number: string;
  recipient_number: string;
  status: 'completed' | 'failed';
  call_time: string;
  recording_url: string | null;
  transcription: string | null;
  created_at: string;
  updated_at: string;
}

interface ContextualLeadPhoneDialogProps {
  dialogId: string;
  leadPhone?: string;
  leadName: string;
  handleClose: () => void;
  onSuccess?: (callData: { phoneNumber: string; duration: number; notes: string }) => void;
}

export function ContextualLeadPhoneDialog({
  dialogId,
  leadPhone,
  leadName,
  handleClose,
  onSuccess
}: ContextualLeadPhoneDialogProps) {
  console.log("⭐⭐⭐ CONTEXTUAL LEAD PHONE DIALOG - Rendering for", leadName);
  
  const { toast } = useToast();
  const { minimizeDialog, updateDialogPosition } = useLeadPhoneDialog();
  const [activeTab, setActiveTab] = useState('call');
  const [callLogs, setCallLogs] = useState<CallLog[]>(mockCallLogs);
  const [smsLogs, setSMSLogs] = useState<SMSMessage[]>(mockSMSLogs);
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callTimer, setCallTimer] = useState<NodeJS.Timeout | null>(null);
  const [callNotes, setCallNotes] = useState('');
  
  // State for dragging functionality
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    console.log("⭐⭐⭐ CONTEXTUAL LEAD PHONE DIALOG - Mounted");
    
    // Fetch call logs when component mounts
    fetchCallLogs();
    fetchSMSLogs();
    
    return () => {
      console.log("⭐⭐⭐ CONTEXTUAL LEAD PHONE DIALOG - Unmounting");
      // Clean up any timers if component unmounts during a call
      if (callTimer) {
        clearInterval(callTimer);
      }
    };
  }, [leadPhone]);
  
  const fetchCallLogs = async () => {
    // In a real implementation, this would fetch from an API
    console.log("⭐⭐⭐ CONTEXTUAL LEAD PHONE DIALOG - Fetching call logs for", leadPhone);
    
    // For now, we'll use mock data
    // In production, you would make an API call like:
    // const response = await fetch(`/api/calls?phoneNumber=${leadPhone}`);
    // const data = await response.json();
    // setCallLogs(data);
    
    // Simulated delay to mimic API call
    setTimeout(() => {
      setCallLogs(mockCallLogs);
    }, 500);
  };
  
  const fetchSMSLogs = async () => {
    // In a real implementation, this would fetch from an API
    console.log("⭐⭐⭐ CONTEXTUAL LEAD PHONE DIALOG - Fetching SMS logs for", leadPhone);
    
    // Simulated delay to mimic API call
    setTimeout(() => {
      setSMSLogs(mockSMSLogs);
    }, 500);
  };
  
  const handleCall = (phoneNumber: string) => {
    console.log("⭐⭐⭐ CONTEXTUAL LEAD PHONE DIALOG - Initiating call to", phoneNumber);
    
    // In a real implementation, this would integrate with a calling API like Twilio
    setIsCalling(true);
    
    // Start a timer to track call duration
    setCallDuration(0);
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    setCallTimer(timer);
    
    // Simulated call duration - in a real implementation, this would be handled by the calling service
    setTimeout(() => {
      clearInterval(timer);
      setCallTimer(null);
      setIsCalling(false);
      
      // Add the call to the logs
      const newCall: CallLog = {
        id: Date.now(),
        direction: 'outbound',
        duration: callDuration + 15, // Add a few seconds since the last update
        caller_number: '+1234567890', // This would be the user's number
        recipient_number: phoneNumber,
        status: 'completed',
        call_time: new Date().toISOString(),
        recording_url: null,
        transcription: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setCallLogs(prevLogs => [newCall, ...prevLogs]);
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess({
          phoneNumber,
          duration: callDuration + 15,
          notes: callNotes
        });
      }
      
      toast({
        title: "Call Completed",
        description: `Call with ${leadName} lasted ${formatDuration(callDuration + 15)}.`,
      });
    }, 15000); // Simulate a 15-second call
  };
  
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const handleSMSContact = (phoneNumber: string) => {
    console.log("⭐⭐⭐ CONTEXTUAL LEAD PHONE DIALOG - Opening SMS tab for", phoneNumber);
    setActiveTab('sms');
  };
  
  const handleSendSMS = (to: string, body: string) => {
    console.log("⭐⭐⭐ CONTEXTUAL LEAD PHONE DIALOG - Sending SMS to", to, "with body:", body);
    
    // In a real implementation, this would integrate with an SMS API
    
    // Add the message to the logs
    const newMessage: SMSMessage = {
      id: Date.now(),
      direction: 'outbound',
      sender_number: '+1234567890', // This would be the user's number
      recipient_number: to,
      body,
      status: 'delivered',
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setSMSLogs(prevLogs => [newMessage, ...prevLogs]);
    
    toast({
      title: "Message Sent",
      description: `Message has been sent to ${leadName}.`,
    });
  };
  
  const handleMinimize = () => {
    console.log("⭐⭐⭐ CONTEXTUAL LEAD PHONE DIALOG - Minimize button clicked for dialog", dialogId);
    minimizeDialog(dialogId, true);
  };
  
  // Mouse handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from the header
    if (!(e.target as HTMLElement).closest('.dialog-header')) return;
    
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };
  
  useEffect(() => {
    // Mouse handlers for dragging
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dialogRef.current) return;
      
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      // Update the dialog position based on mouse movement
      const dialogElement = dialogRef.current;
      const rect = dialogElement.getBoundingClientRect();
      
      // Calculate new position
      let newX = rect.left + dx;
      let newY = rect.top + dy;
      
      // Ensure dialog stays within viewport bounds
      newX = Math.max(0, Math.min(newX, window.innerWidth - rect.width));
      newY = Math.max(0, Math.min(newY, window.innerHeight - rect.height));
      
      // Apply the new position
      dialogElement.style.position = 'fixed';
      dialogElement.style.left = `${newX}px`;
      dialogElement.style.top = `${newY}px`;
      dialogElement.style.margin = '0';
      
      // Update drag start position for next movement
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseUp = () => {
      if (isDragging && dialogRef.current) {
        setIsDragging(false);
        
        // Get final position and update in context
        const rect = dialogRef.current.getBoundingClientRect();
        updateDialogPosition(dialogId, {
          x: rect.left,
          y: rect.top
        });
      }
    };
    
    // Add event listeners for mouse move and up
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    // Clean up event listeners
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dialogId, updateDialogPosition]);
  
  return (
    <div 
      ref={dialogRef}
      className={cn(
        "bg-background rounded-lg shadow-lg overflow-hidden w-full max-w-md border",
        isDragging && "cursor-grabbing"
      )}
      onMouseDown={handleMouseDown}
    >
      <div className="p-4 bg-primary text-primary-foreground flex justify-between items-center dialog-header cursor-grab">
        <h2 className="text-xl font-semibold select-none">
          {isCalling ? `Call in progress: ${formatDuration(callDuration)}` : `Call: ${leadName}`}
        </h2>
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary-foreground hover:bg-primary/80"
            onClick={handleMinimize}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary-foreground hover:bg-primary/80 ml-1"
            onClick={handleClose}
          >
            <span className="sr-only">Close</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="call" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="call" className="flex items-center">
            <Phone className="h-4 w-4 mr-2" />
            <span>Call</span>
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>SMS</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="call" className="pt-4">
          <div className="flex flex-col items-center">
            <div className="flex flex-col items-center mb-4">
              <div className="h-16 w-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-2">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">{leadName}</h2>
              <p className="text-muted-foreground">{leadPhone}</p>
            </div>
            
            {isCalling ? (
              <div className="flex flex-col items-center my-4">
                <div className="text-2xl font-semibold mb-2">Call in progress</div>
                <div className="text-xl mb-4">{formatDuration(callDuration)}</div>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (callTimer) {
                      clearInterval(callTimer);
                      setCallTimer(null);
                    }
                    setIsCalling(false);
                    
                    // Record the call in logs
                    const newCall: CallLog = {
                      id: Date.now(),
                      direction: 'outbound',
                      duration: callDuration,
                      caller_number: '+1234567890', // This would be the user's number
                      recipient_number: leadPhone || '',
                      status: 'completed',
                      call_time: new Date().toISOString(),
                      recording_url: null,
                      transcription: null,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    };
                    
                    setCallLogs(prevLogs => [newCall, ...prevLogs]);
                    
                    // Call the onSuccess callback if provided
                    if (onSuccess) {
                      onSuccess({
                        phoneNumber: leadPhone || '',
                        duration: callDuration,
                        notes: callNotes
                      });
                    }
                    
                    toast({
                      title: "Call Ended",
                      description: `Call with ${leadName} lasted ${formatDuration(callDuration)}.`,
                    });
                  }}
                >
                  End Call
                </Button>
              </div>
            ) : (
              <Dialpad 
                initialNumber={leadPhone || ''} 
                onCall={handleCall} 
                onSMS={handleSMSContact}
              />
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="sms" className="pt-4">
          <div className="grid grid-cols-1 gap-4">
            <SMSComposer
              phoneNumber={leadPhone || ''}
              onSend={handleSendSMS} 
            />
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Recent Messages</h3>
              <SMSLog messages={smsLogs} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="pt-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Call History</h3>
              <div className="space-y-2">
                {callLogs.length === 0 ? (
                  <p className="text-muted-foreground">No call history available.</p>
                ) : (
                  callLogs.map(call => (
                    <div key={call.id} className="border dark:border-border rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          {call.direction === 'outbound' ? (
                            <Phone className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 transform rotate-45" />
                          ) : (
                            <Phone className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-2 transform -rotate-45" />
                          )}
                          <span>{call.direction === 'outbound' ? 'Outgoing' : 'Incoming'}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(call.call_time), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="text-sm">
                          {call.direction === 'outbound' ? call.recipient_number : call.caller_number}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-muted-foreground">
                          Duration: {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                        </span>
                        <span className={`text-sm ${call.status === 'completed' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                          {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                        </span>
                      </div>
                      {call.transcription && (
                        <div className="mt-2 p-2 bg-muted/50 dark:bg-muted/30 rounded text-sm">
                          {call.transcription}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">SMS History</h3>
              <SMSLog messages={smsLogs} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 