import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Send, 
  Paperclip, 
  Smile, 
  ChevronDown, 
  ChevronUp,
  User,
  ArrowUpRight
} from 'lucide-react';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';

export type CommunicationType = 'email' | 'call' | 'meeting' | 'note';

export interface Communication {
  id: string;
  type: CommunicationType;
  contactId: string;
  contactName: string;
  contactAvatar?: string;
  timestamp: string;
  content: string;
  subject?: string;
  duration?: string;
  attachments?: string[];
  isIncoming?: boolean;
  isRead?: boolean;
  isScheduled?: boolean;
  scheduledFor?: string;
}

interface CommunicationPanelProps {
  communications: Communication[];
  selectedContactId?: string;
  onSendMessage: (message: Omit<Communication, 'id' | 'timestamp'>) => void;
  onScheduleCall: (call: Omit<Communication, 'id' | 'timestamp'>) => void;
}

export function CommunicationPanel({ 
  communications, 
  selectedContactId, 
  onSendMessage, 
  onScheduleCall 
}: CommunicationPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  
  const getFilteredCommunications = () => {
    let filtered = communications;
    
    if (selectedContactId) {
      filtered = filtered.filter(comm => comm.contactId === selectedContactId);
    }
    
    switch (activeTab) {
      case 'emails':
        return filtered.filter(comm => comm.type === 'email');
      case 'calls':
        return filtered.filter(comm => comm.type === 'call');
      case 'meetings':
        return filtered.filter(comm => comm.type === 'meeting');
      case 'notes':
        return filtered.filter(comm => comm.type === 'note');
      case 'scheduled':
        return filtered.filter(comm => comm.isScheduled);
      default:
        return filtered;
    }
  };
  
  const handleSendMessage = () => {
    if (newMessage.trim() && selectedContactId) {
      onSendMessage({
        type: 'email',
        contactId: selectedContactId,
        contactName: 'John Doe', // This would come from the selected contact
        content: newMessage,
        subject: 'New message',
        isIncoming: false,
        isRead: true,
      });
      
      setNewMessage('');
    }
  };
  
  const typeIcons = {
    email: <Mail className="h-4 w-4" />,
    call: <Phone className="h-4 w-4" />,
    meeting: <Calendar className="h-4 w-4" />,
    note: <MessageSquare className="h-4 w-4" />,
  };
  
  const typeColors = {
    email: 'text-blue-500',
    call: 'text-green-500',
    meeting: 'text-purple-500',
    note: 'text-amber-500',
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-lg">Communications</h3>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
              onClick={() => setShowScheduler(!showScheduler)}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Schedule
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
            >
              <Phone className="h-4 w-4 mr-1" />
              Call
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="emails">Emails</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="p-4 pt-4 flex-1 overflow-hidden">
        <AnimatePresence>
          {showScheduler && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-4"
            >
              <Card className="border border-dashed">
                <CardHeader className="p-3 pb-0">
                  <h4 className="text-sm font-medium">Schedule Communication</h4>
                </CardHeader>
                <CardContent className="p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                      <select className="w-full text-sm p-2 rounded-md border border-input bg-background">
                        <option value="call">Call</option>
                        <option value="meeting">Meeting</option>
                        <option value="email">Email</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Date & Time</label>
                      <Input type="datetime-local" className="text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                    <Textarea placeholder="Add notes about this scheduled communication..." className="text-sm" rows={2} />
                  </div>
                </CardContent>
                <CardFooter className="p-3 pt-0 flex justify-end space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowScheduler(false)}>
                    Cancel
                  </Button>
                  <Button size="sm">
                    Schedule
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        <ScrollArea className="h-[calc(100%-120px)]">
          <div className="space-y-4">
            {getFilteredCommunications().length > 0 ? (
              getFilteredCommunications().map((comm) => (
                <CommunicationItem key={comm.id} communication={comm} />
              ))
            ) : (
              <div className="h-32 flex items-center justify-center border border-dashed border-border rounded-md">
                <p className="text-sm text-muted-foreground">No communications found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 border-t border-border">
        <div className="w-full space-y-3">
          <Textarea 
            placeholder="Type a message..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || !selectedContactId}
            >
              <Send className="h-4 w-4 mr-1" /> Send
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

interface CommunicationItemProps {
  communication: Communication;
}

function CommunicationItem({ communication }: CommunicationItemProps) {
  const typeIcons = {
    email: <Mail className="h-4 w-4" />,
    call: <Phone className="h-4 w-4" />,
    meeting: <Calendar className="h-4 w-4" />,
    note: <MessageSquare className="h-4 w-4" />,
  };
  
  const typeColors = {
    email: 'text-blue-500',
    call: 'text-green-500',
    meeting: 'text-purple-500',
    note: 'text-amber-500',
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`overflow-hidden ${communication.isScheduled ? 'border-blue-400/30' : ''}`}>
        <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between space-y-0">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              {communication.contactAvatar ? (
                <img src={communication.contactAvatar} alt={communication.contactName} />
              ) : (
                <User className="h-4 w-4" />
              )}
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-sm">{communication.contactName}</h4>
                <Badge variant="outline" className={`${typeColors[communication.type]} text-[10px] px-1.5 py-0 h-4 border-current`}>
                  <span className="mr-1">{typeIcons[communication.type]}</span>
                  {communication.type.charAt(0).toUpperCase() + communication.type.slice(1)}
                </Badge>
                {communication.isScheduled && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    <Clock className="h-2.5 w-2.5 mr-1" /> Scheduled
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <p className="text-xs text-muted-foreground">
                  {communication.isScheduled 
                    ? `Scheduled for ${formatTimestamp(communication.scheduledFor || '')}` 
                    : formatTimestamp(communication.timestamp)}
                </p>
                {communication.duration && (
                  <span className="text-xs text-muted-foreground">• {communication.duration}</span>
                )}
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-3 pt-0">
          {communication.subject && (
            <h5 className="text-sm font-medium mb-1">{communication.subject}</h5>
          )}
          <p className="text-sm whitespace-pre-line">{communication.content}</p>
          
          {communication.attachments && communication.attachments.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Attachments:</p>
              <div className="flex flex-wrap gap-2">
                {communication.attachments.map((attachment, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <Paperclip className="h-3 w-3 mr-1" />
                    {attachment}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 