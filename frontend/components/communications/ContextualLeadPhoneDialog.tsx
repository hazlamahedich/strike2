'use client';

import React, { useState, useEffect } from 'react';
import { MeetingDialogContent } from '../ui/meeting-dialog';
import { MeetingDialogType } from '../../contexts/MeetingDialogContext';
import { useToast } from '../ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Phone, MessageSquare, Clock, User } from 'lucide-react';
import Dialpad from './Dialpad';
import SMSComposer from './SMSComposer';
import SMSLog from './SMSLog';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import type { SMSMessage } from '../../types/communications';

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
  const [activeTab, setActiveTab] = useState('call');
  const [callLogs, setCallLogs] = useState<CallLog[]>(mockCallLogs);
  const [smsLogs, setSMSLogs] = useState<SMSMessage[]>(mockSMSLogs);
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callTimer, setCallTimer] = useState<NodeJS.Timeout | null>(null);
  const [callNotes, setCallNotes] = useState('');
  
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
  
  return (
    <div 
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        width: '95%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}
    >
      <MeetingDialogContent
        dialogId={dialogId}
        dialogType={MeetingDialogType.PHONE}
        title={`Contact ${leadName}`}
        onClose={handleClose}
      >
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="call" className="flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                Call
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                SMS
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="call" className="pt-4">
              <div className="flex flex-col items-center">
                <div className="flex flex-col items-center mb-4">
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
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
                        <div key={call.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              {call.direction === 'outbound' ? (
                                <Phone className="h-4 w-4 text-green-500 mr-2 transform rotate-45" />
                              ) : (
                                <Phone className="h-4 w-4 text-blue-500 mr-2 transform -rotate-45" />
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
                            <span className={`text-sm ${call.status === 'completed' ? 'text-green-500' : 'text-red-500'}`}>
                              {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                            </span>
                          </div>
                          {call.transcription && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
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
      </MeetingDialogContent>
    </div>
  );
} 