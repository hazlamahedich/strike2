import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  Clock, 
  Search,
  Phone,
  Reply
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format, formatDistance } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';

// Define the SMS message type
export interface SMSMessage {
  id: number;
  contact_id?: number;
  lead_id?: number;
  direction: 'inbound' | 'outbound';
  body: string;
  sender_number: string;
  recipient_number: string;
  status: 'delivered' | 'failed' | 'pending' | 'read';
  sent_time: string;
  message_sid?: string;
  contact?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

// Mock API function to fetch SMS logs
const fetchSMSLogs = async (): Promise<SMSMessage[]> => {
  // In a real app, this would be an API call to your backend
  return [
    {
      id: 1,
      direction: 'outbound',
      body: 'Hi John, following up on our conversation yesterday. Are you available for a call tomorrow at 2pm?',
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
    },
    {
      id: 3,
      direction: 'outbound',
      body: 'Hi Sarah, just checking if you received the proposal I sent yesterday?',
      sender_number: '+15551234567',
      recipient_number: '+15557654321',
      status: 'delivered',
      sent_time: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      message_sid: 'SM456789123',
      contact: {
        id: 2,
        name: 'Sarah Johnson'
      },
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    },
    {
      id: 4,
      direction: 'inbound',
      body: 'Yes, I got it. I\'ll review it today and get back to you.',
      sender_number: '+15557654321',
      recipient_number: '+15551234567',
      status: 'read',
      sent_time: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
      message_sid: 'SM321654987',
      contact: {
        id: 2,
        name: 'Sarah Johnson'
      },
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    },
    {
      id: 5,
      direction: 'outbound',
      body: 'Meeting reminder: Team sync at 3pm today in Conference Room A',
      sender_number: '+15551234567',
      recipient_number: '+15558765432',
      status: 'pending',
      sent_time: new Date().toISOString(), // Just now
      message_sid: 'SM567891234',
      contact: {
        id: 3,
        name: 'Michael Brown'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
};

// Mock API function to send SMS
const sendSMS = async (to: string, body: string): Promise<{ success: boolean; message_id: string }> => {
  // In a real app, this would be an API call to your backend
  console.log(`Sending SMS to ${to}: ${body}`);
  return { success: true, message_id: `SM${Math.random().toString(36).substring(2, 15)}` };
};

interface SMSLogProps {
  onSMSContact?: (phoneNumber: string) => void;
  onCallContact?: (phoneNumber: string) => void;
  onEmailContact?: (email: string, name: string) => void;
}

export default function SMSLog({ 
  onSMSContact, 
  onCallContact,
  onEmailContact 
}: SMSLogProps) {
  const { toast } = useToast();
  const [smsLogs, setSMSLogs] = useState<SMSMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSMS, setSelectedSMS] = useState<SMSMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  // Fetch SMS logs on component mount
  useEffect(() => {
    const loadSMSLogs = async () => {
      try {
        setIsLoading(true);
        const data = await fetchSMSLogs();
        setSMSLogs(data);
      } catch (error) {
        console.error('Failed to fetch SMS logs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load SMS logs. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSMSLogs();
  }, [toast]);

  // Filter SMS logs based on search query and selected filter
  const filteredSMSLogs = smsLogs.filter(sms => {
    const matchesSearch = 
      sms.contact?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sms.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sms.sender_number.includes(searchQuery) ||
      sms.recipient_number.includes(searchQuery);
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'inbound') return matchesSearch && sms.direction === 'inbound';
    if (selectedFilter === 'outbound') return matchesSearch && sms.direction === 'outbound';
    
    return matchesSearch;
  });

  // Handle SMS contact
  const handleSMSContact = (phoneNumber: string) => {
    if (onSMSContact) {
      onSMSContact(phoneNumber);
    } else {
      // Fallback if no handler is provided
      window.location.href = `sms:${phoneNumber}`;
    }
  };

  // Handle call contact
  const handleCallContact = (phoneNumber: string) => {
    if (onCallContact) {
      onCallContact(phoneNumber);
    } else {
      // Fallback if no handler is provided
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  // Handle email contact
  const handleEmailContact = (email: string, name: string) => {
    if (onEmailContact) {
      onEmailContact(email, name);
    }
  };

  // Open message dialog
  const openMessageDialog = (sms: SMSMessage) => {
    setSelectedSMS(sms);
    setShowMessageDialog(true);
  };

  // Handle reply to SMS
  const handleReply = async () => {
    if (!selectedSMS || !replyText.trim()) return;
    
    try {
      setIsSending(true);
      
      // Determine the recipient number (the sender of the selected SMS)
      const recipientNumber = selectedSMS.direction === 'inbound' 
        ? selectedSMS.sender_number 
        : selectedSMS.recipient_number;
      
      const result = await sendSMS(recipientNumber, replyText);
      
      if (result.success) {
        toast({
          title: 'SMS Sent',
          description: 'Your reply has been sent successfully.',
        });
        
        // Add the new message to the logs
        const newMessage: SMSMessage = {
          id: smsLogs.length + 1,
          direction: 'outbound',
          body: replyText,
          sender_number: selectedSMS.recipient_number, // Our number
          recipient_number: recipientNumber,
          status: 'delivered',
          sent_time: new Date().toISOString(),
          message_sid: result.message_id,
          contact: selectedSMS.contact,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setSMSLogs(prev => [newMessage, ...prev]);
        setReplyText('');
        setShowMessageDialog(false);
      } else {
        throw new Error('Failed to send SMS');
      }
    } catch (error) {
      console.error('Failed to send SMS reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to send SMS reply. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  // Render direction icon
  const renderDirectionIcon = (direction: 'inbound' | 'outbound') => {
    if (direction === 'inbound') {
      return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
    } else {
      return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Delivered</Badge>;
      case 'read':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Read</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS Messages</CardTitle>
        <CardDescription>
          View and manage your SMS conversations
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={selectedFilter}
            onValueChange={setSelectedFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading SMS logs...</p>
          </div>
        ) : filteredSMSLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No SMS messages found</p>
            {searchQuery && (
              <Button 
                variant="link" 
                onClick={() => setSearchQuery('')}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Direction</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSMSLogs.map((sms) => (
                  <TableRow key={sms.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openMessageDialog(sms)}>
                    <TableCell>
                      <div className="flex items-center">
                        {renderDirectionIcon(sms.direction)}
                        <span className="ml-2 text-xs">
                          {sms.direction === 'inbound' ? 'Received' : 'Sent'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {sms.contact?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sms.direction === 'inbound' ? sms.sender_number : sms.recipient_number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate">
                        {sms.body}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-xs">
                          {formatDistance(new Date(sms.sent_time), new Date(), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(sms.sent_time), 'MMM d, yyyy h:mm a')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(sms.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSMSContact(sms.direction === 'inbound' ? sms.sender_number : sms.recipient_number);
                          }}
                          title="Send SMS"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCallContact(sms.direction === 'inbound' ? sms.sender_number : sms.recipient_number);
                          }}
                          title="Call"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSMS?.contact?.name || 'Unknown'}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {selectedSMS?.direction === 'inbound' 
                  ? selectedSMS?.sender_number 
                  : selectedSMS?.recipient_number}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {renderDirectionIcon(selectedSMS?.direction || 'inbound')}
                  <span className="ml-2 text-xs">
                    {selectedSMS?.direction === 'inbound' ? 'Received' : 'Sent'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedSMS && format(new Date(selectedSMS.sent_time), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
              <p className="whitespace-pre-wrap">{selectedSMS?.body}</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="reply" className="text-sm font-medium">
                Reply
              </label>
              <Textarea
                id="reply"
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (selectedSMS) {
                      handleCallContact(
                        selectedSMS.direction === 'inbound' 
                          ? selectedSMS.sender_number 
                          : selectedSMS.recipient_number
                      );
                    }
                  }}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              </div>
              <Button 
                onClick={handleReply}
                disabled={!replyText.trim() || isSending}
              >
                <Reply className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Send Reply'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 