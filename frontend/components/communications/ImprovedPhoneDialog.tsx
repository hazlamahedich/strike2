'use client';

import React, { useState, useEffect } from 'react';
import {
  ImprovedDialogContent,
  ImprovedDialogHeader,
  ImprovedDialogFooter,
} from '../ui/improved-dialog';
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
import { useImprovedDialog } from '@/lib/contexts/ImprovedDialogContext';

interface PhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadPhone?: string;
  leadName: string;
  onSuccess?: (callData: { phoneNumber: string; duration: number; notes: string }) => void;
}

export function ImprovedPhoneDialog({ open, onOpenChange, leadPhone, leadName, onSuccess }: PhoneDialogProps) {
  const { toast } = useToast();
  const { openDialog, closeDialog } = useImprovedDialog();
  const dialogId = `phone-dialog-${leadPhone}`;
  
  const [activeTab, setActiveTab] = useState('call');
  const [isCalling, setIsCalling] = useState(false);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (open) {
      fetchCallLogs();
      fetchSMSLogs();
      
      // Create and open the dialog
      renderPhoneDialog();
    } else {
      closeDialog(dialogId);
    }
  }, [open, leadPhone]);
  
  const renderPhoneDialog = () => {
    openDialog(
      dialogId,
      <ImprovedDialogContent dialogId={dialogId} className="sm:max-w-md">
        <ImprovedDialogHeader>
          <h2 className="text-lg font-semibold">Phone Communication</h2>
          <p className="text-sm text-muted-foreground">
            Call or text {leadName}
          </p>
        </ImprovedDialogHeader>
        
        <Tabs defaultValue="call" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="call">Call</TabsTrigger>
            <TabsTrigger value="history">Call History</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
          </TabsList>
          
          <TabsContent value="call" className="space-y-4 p-2">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center mb-2">
                <User className="h-12 w-12 text-muted-foreground bg-muted p-2 rounded-full" />
              </div>
              <h3 className="text-lg font-medium">{leadName}</h3>
              {leadPhone && <p className="text-muted-foreground">{leadPhone}</p>}
            </div>
            
            <Dialpad 
              defaultNumber={leadPhone || ''} 
              onCall={handleCall} 
              isCalling={isCalling}
            />
          </TabsContent>
          
          <TabsContent value="history">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground">Loading call history...</p>
              </div>
            ) : (
              <CallLog logs={callLogs} formatDuration={formatDuration} />
            )}
          </TabsContent>
          
          <TabsContent value="sms">
            <div className="space-y-4">
              <SMSComposer 
                recipientName={leadName}
                recipientNumber={leadPhone || ''}
                onSend={handleSendSMS}
              />
              
              <div className="divider my-4 h-px bg-muted"></div>
              
              <h3 className="text-md font-medium mb-2">Message History</h3>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <p className="text-muted-foreground">Loading messages...</p>
                </div>
              ) : (
                <SMSLog logs={smsLogs} />
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <ImprovedDialogFooter>
          <Button variant="outline" onClick={() => {
            closeDialog(dialogId);
            onOpenChange(false);
          }}>
            Close
          </Button>
        </ImprovedDialogFooter>
      </ImprovedDialogContent>
    );
  };
  
  const fetchCallLogs = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch call logs from an API
      // For this mock, we'll just use the static data after a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data - in a real app this would come from an API
      const mockLogs = [
        {
          id: 1,
          direction: 'outbound',
          duration: 120,
          caller_number: '+1234567890',
          recipient_number: leadPhone,
          status: 'completed',
          call_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          notes: 'Discussed pricing options and next steps.'
        },
        {
          id: 2,
          direction: 'inbound',
          duration: 60,
          caller_number: leadPhone,
          recipient_number: '+1234567890',
          status: 'completed',
          call_time: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          notes: 'Client called with questions about the proposal.'
        }
      ];
      
      setCallLogs(mockLogs);
    } catch (error) {
      toast({
        title: 'Error loading call logs',
        description: 'Could not load call history. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchSMSLogs = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch SMS logs from an API
      // For this mock, we'll just use static data after a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data - in a real app this would come from an API
      const mockLogs = [
        {
          id: 1,
          direction: 'outbound',
          sender: '+1234567890',
          recipient: leadPhone,
          content: 'Hi, just following up on our conversation yesterday. Let me know if you have any questions!',
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString() // 2 hours ago
        },
        {
          id: 2,
          direction: 'inbound',
          sender: leadPhone,
          recipient: '+1234567890',
          content: 'Thanks for checking in. I'll review the proposal and get back to you tomorrow.',
          timestamp: new Date(Date.now() - 1 * 3600000).toISOString() // 1 hour ago
        }
      ];
      
      setSmsLogs(mockLogs);
    } catch (error) {
      toast({
        title: 'Error loading SMS logs',
        description: 'Could not load message history. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCall = (phoneNumber: string) => {
    setIsCalling(true);
    
    // Simulate a call
    toast({
      title: 'Calling...',
      description: `Calling ${phoneNumber}`,
    });
    
    // In a real app, this would initiate a call via an API
    setTimeout(() => {
      setIsCalling(false);
      
      // Mock successful call completion
      handleCallComplete('call123', 45, 'Discussed meeting schedule and next steps.');
      
      toast({
        title: 'Call ended',
        description: `Call to ${phoneNumber} ended`,
      });
    }, 3000);
  };
  
  const handleCallComplete = (callSid: string, duration: number, notes: string = '') => {
    // In a real app, this would log the call to the server
    
    // Add the call to the logs
    const newCall = {
      id: Date.now(),
      direction: 'outbound',
      duration: duration,
      caller_number: '+1234567890', // Would be the user's number
      recipient_number: leadPhone,
      status: 'completed',
      call_time: new Date().toISOString(),
      notes: notes
    };
    
    setCallLogs(prev => [newCall, ...prev]);
    
    // Switch to the history tab
    setActiveTab('history');
    
    // Call the onSuccess callback if provided
    if (onSuccess && leadPhone) {
      onSuccess({
        phoneNumber: leadPhone,
        duration: duration,
        notes: notes
      });
    }
  };
  
  const handleSendSMS = (to: string, body: string) => {
    // In a real app, this would send an SMS via an API
    
    toast({
      title: 'SMS sent',
      description: `Message sent to ${to}`,
    });
    
    // Add the SMS to the logs
    const newSMS = {
      id: Date.now(),
      direction: 'outbound',
      sender: '+1234567890', // Would be the user's number
      recipient: to,
      content: body,
      timestamp: new Date().toISOString()
    };
    
    setSmsLogs(prev => [newSMS, ...prev]);
  };
  
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  const handleSMSContact = (phoneNumber: string) => {
    setActiveTab('sms');
  };
  
  // The actual rendering is handled by ImprovedDialogContainer
  return null;
}

export default ImprovedPhoneDialog; 