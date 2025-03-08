'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, User, Clock, MessageSquare } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import Dialpad from './Dialpad';
import CallLog from './CallLog';
import SMSComposer from './SMSComposer';
import SMSLog from './SMSLog';
import { format } from 'date-fns';
import { Contact } from '../../lib/services/communicationService';

// Mock call log data
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
    duration: 60,
    caller_number: '+0987654321',
    recipient_number: '+1234567890',
    status: 'completed' as const,
    call_time: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    recording_url: 'https://api.twilio.com/2010-04-01/Accounts/AC123/Recordings/RE456.mp3',
    transcription: "Hi, I'm returning your call about the proposal. I think we can move forward with the project. Let's schedule a follow-up call next week.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    direction: 'inbound' as const,
    duration: 0,
    caller_number: '+0987654321',
    recipient_number: '+1234567890',
    status: 'missed' as const,
    call_time: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Mock SMS logs data
const mockSMSLogs = [
  {
    id: 1,
    direction: 'outbound',
    body: 'Hi, following up on our conversation yesterday. Are you available for a call tomorrow at 2pm?',
    sender_number: '+15551234567',
    recipient_number: '+15559876543',
    status: 'delivered',
    sent_time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    message_sid: 'SM123456789',
    contact: {
      id: 1,
      name: 'John Smith'
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 2,
    direction: 'inbound',
    body: 'Yes, 2pm works for me. Looking forward to it!',
    sender_number: '+15559876543',
    recipient_number: '+15551234567',
    status: 'read',
    sent_time: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), // 1 hour ago
    message_sid: 'SM987654321',
    contact: {
      id: 1,
      name: 'John Smith'
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString()
  }
];

interface PhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadPhone?: string;
  leadName: string;
  onSuccess?: (callData: { phoneNumber: string; duration: number; notes: string }) => void;
}

export function PhoneDialog({ open, onOpenChange, leadPhone, leadName, onSuccess }: PhoneDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dialpad');
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [smsLogs, setSMSLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSMSLoading, setIsSMSLoading] = useState(false);
  const [activePhoneNumber, setActivePhoneNumber] = useState<string | undefined>(leadPhone);
  
  // Fetch call logs when dialog opens
  useEffect(() => {
    if (open) {
      fetchCallLogs();
      fetchSMSLogs();
    }
  }, [open, leadPhone]);
  
  const fetchCallLogs = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would be an API call
      // For now, we'll use mock data
      setTimeout(() => {
        setCallLogs(mockCallLogs);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching call logs:', error);
      toast({
        title: 'Failed to load call logs',
        description: 'There was an error loading call logs. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const fetchSMSLogs = async () => {
    setIsSMSLoading(true);
    try {
      // In a real implementation, this would be an API call
      // For now, we'll use mock data
      setTimeout(() => {
        setSMSLogs(mockSMSLogs);
        setIsSMSLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
      toast({
        title: 'Failed to load SMS logs',
        description: 'There was an error loading SMS logs. Please try again.',
        variant: 'destructive',
      });
      setIsSMSLoading(false);
    }
  };
  
  // Handle initiating a call
  const handleCall = (phoneNumber: string) => {
    toast({
      title: 'Calling...',
      description: `Initiating call to ${phoneNumber}`,
    });
    // In a real implementation, this would initiate a call via Twilio
  };
  
  // Handle call completion
  const handleCallComplete = (callSid: string, duration: number, notes: string = '') => {
    // In a real implementation, this would update the call record in the database
    console.log(`Call ${callSid} completed with duration ${duration} seconds`);
    
    // Show toast
    toast({
      title: 'Call completed',
      description: `Call duration: ${formatDuration(duration)}`,
    });
    
    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess({
        phoneNumber: activePhoneNumber || leadPhone || '',
        duration,
        notes
      });
    }
  };

  // Handle sending SMS
  const handleSendSMS = (to: string, body: string) => {
    toast({
      title: 'SMS Sent',
      description: `Message sent to ${to}`,
    });
    fetchSMSLogs(); // Refresh SMS logs
  };
  
  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle SMS contact
  const handleSMSContact = (phoneNumber: string) => {
    setActiveTab('sms');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Communication with {leadName}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mb-4">
            <TabsTrigger value="dialpad">
              <Phone className="h-4 w-4 mr-2" />
              Dialpad
            </TabsTrigger>
            <TabsTrigger value="sms">
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="call-log">
              <Clock className="h-4 w-4 mr-2" />
              Call Log
            </TabsTrigger>
            <TabsTrigger value="sms-log">
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS Log
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <User className="h-4 w-4 mr-2" />
              Contacts
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dialpad" className="flex-1 overflow-auto">
            <Dialpad 
              initialPhoneNumber={leadPhone} 
              onCallComplete={handleCallComplete}
            />
          </TabsContent>

          <TabsContent value="sms" className="flex-1 overflow-auto">
            <SMSComposer 
              contact={leadPhone ? {
                id: 0,
                name: leadName,
                phone_number: leadPhone,
                email: '',
                contact_type: 'lead' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } : undefined}
              onSMSSent={handleSendSMS}
            />
          </TabsContent>
          
          <TabsContent value="call-log" className="flex-1 overflow-auto">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Call History</h3>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : callLogs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No call history found for this lead.</p>
              ) : (
                <div className="space-y-4">
                  {callLogs.map((log) => (
                    <div key={log.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          {log.direction === 'inbound' ? (
                            log.status === 'missed' ? (
                              <PhoneMissed className="h-5 w-5 text-red-500 mr-2" />
                            ) : (
                              <PhoneIncoming className="h-5 w-5 text-green-500 mr-2" />
                            )
                          ) : (
                            <PhoneOutgoing className="h-5 w-5 text-blue-500 mr-2" />
                          )}
                          <div>
                            <p className="font-medium">
                              {log.direction === 'inbound' ? 'Incoming call' : 'Outgoing call'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(log.call_time), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {log.duration > 0 ? formatDuration(log.duration) : 'No answer'}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {log.status}
                          </p>
                        </div>
                      </div>
                      
                      {log.transcription && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium mb-1">Transcription:</p>
                          <p className="text-sm">{log.transcription}</p>
                        </div>
                      )}
                      
                      <div className="mt-4 flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleCall(log.direction === 'inbound' ? log.caller_number : log.recipient_number)}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call Back
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSMSContact(log.direction === 'inbound' ? log.caller_number : log.recipient_number)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send SMS
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sms-log" className="flex-1 overflow-auto">
            <SMSLog 
              onSMSContact={handleSMSContact}
              onCallContact={handleCall}
            />
          </TabsContent>
          
          <TabsContent value="contacts" className="flex-1 overflow-auto">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              
              <div className="border rounded-md p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{leadName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{leadPhone || 'No phone number'}</p>
                  </div>
                </div>
                
                {leadPhone && (
                  <div className="mt-4 flex space-x-2">
                    <Button 
                      onClick={() => {
                        setActiveTab('dialpad');
                      }}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Now
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setActiveTab('sms');
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send SMS
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <h4 className="text-md font-medium mb-2">Other Contacts</h4>
                <p className="text-sm text-muted-foreground">No additional contacts found for this lead.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 