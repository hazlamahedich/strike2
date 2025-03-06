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
  DialogTrigger,
  DialogFooter,
  DialogClose
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Clock, 
  Calendar, 
  Search,
  Play,
  FileText,
  User
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format, formatDistance } from 'date-fns';

// Define the call log type
export interface CallLog {
  id: number;
  contact_id?: number;
  lead_id?: number;
  direction: 'inbound' | 'outbound';
  duration?: number;
  notes?: string;
  caller_number: string;
  recipient_number: string;
  status: 'completed' | 'missed' | 'voicemail' | 'failed';
  call_time: string;
  call_sid?: string;
  recording_url?: string;
  transcription?: string;
  contact?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

// Mock API functions (replace with actual API calls)
const fetchCallLogs = async (): Promise<CallLog[]> => {
  // In a real app, this would be an API call
  return [
    {
      id: 1,
      contact_id: 1,
      lead_id: 1,
      direction: 'outbound',
      duration: 120,
      caller_number: '+1234567890',
      recipient_number: '+0987654321',
      status: 'completed',
      call_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      recording_url: 'https://api.twilio.com/2010-04-01/Accounts/AC123/Recordings/RE123.mp3',
      transcription: 'Hello, this is a test call. I wanted to discuss our upcoming meeting. Please call me back when you have a chance.',
      contact: {
        id: 1,
        name: 'John Doe'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      contact_id: 2,
      lead_id: 2,
      direction: 'inbound',
      duration: 60,
      caller_number: '+0987654321',
      recipient_number: '+1234567890',
      status: 'completed',
      call_time: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      recording_url: 'https://api.twilio.com/2010-04-01/Accounts/AC123/Recordings/RE456.mp3',
      transcription: "Hi, I'm returning your call about the proposal. I think we can move forward with the project. Let's schedule a follow-up call next week.",
      contact: {
        id: 2,
        name: 'Jane Smith'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      contact_id: 3,
      lead_id: 3,
      direction: 'inbound',
      duration: 0,
      caller_number: '+1122334455',
      recipient_number: '+1234567890',
      status: 'missed',
      call_time: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      contact: {
        id: 3,
        name: 'Bob Johnson'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
};

export default function CallLog({ onCallContact }: { onCallContact?: (phoneNumber: string) => void }) {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedCallLog, setSelectedCallLog] = useState<CallLog | null>(null);
  const [isTranscriptDialogOpen, setIsTranscriptDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch call logs on component mount
  useEffect(() => {
    const loadCallLogs = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCallLogs();
        setCallLogs(data);
      } catch (error) {
        console.error('Failed to fetch call logs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load call logs. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCallLogs();
  }, [toast]);

  // Filter call logs based on search term and filters
  const filteredCallLogs = callLogs.filter(log => {
    // Filter by search term
    const matchesSearch = 
      (log.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      log.caller_number.includes(searchTerm) ||
      log.recipient_number.includes(searchTerm) ||
      (log.transcription && log.transcription.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by direction
    const matchesDirection = filterDirection === 'all' || log.direction === filterDirection;
    
    // Filter by status
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    
    return matchesSearch && matchesDirection && matchesStatus;
  });

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle initiating a call to a contact
  const handleCallContact = (phoneNumber: string) => {
    if (onCallContact) {
      onCallContact(phoneNumber);
    } else {
      toast({
        title: 'Call Initiated',
        description: `Calling ${phoneNumber}...`,
      });
    }
  };

  // Open transcript dialog
  const openTranscriptDialog = (callLog: CallLog) => {
    setSelectedCallLog(callLog);
    setIsTranscriptDialogOpen(true);
  };

  // Render call direction icon
  const renderDirectionIcon = (direction: 'inbound' | 'outbound', status: string) => {
    if (status === 'missed') {
      return <PhoneMissed className="h-4 w-4 text-red-500" />;
    }
    
    return direction === 'inbound' 
      ? <PhoneIncoming className="h-4 w-4 text-green-500" /> 
      : <PhoneOutgoing className="h-4 w-4 text-blue-500" />;
  };

  // Render call status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'missed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Missed</Badge>;
      case 'voicemail':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Voicemail</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Call Log</h2>
        <div className="flex space-x-2">
          <Select value={filterDirection} onValueChange={setFilterDirection}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directions</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
              <SelectItem value="voicemail">Voicemail</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search call logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCallLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No call logs found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCallLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {log.contact?.name || log.direction === 'inbound' ? log.caller_number : log.recipient_number}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {renderDirectionIcon(log.direction, log.status)}
                        <span className="capitalize">{log.direction}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(log.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{format(new Date(log.call_time), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{format(new Date(log.call_time), 'h:mm a')}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.duration ? formatDuration(log.duration) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleCallContact(log.direction === 'inbound' ? log.caller_number : log.recipient_number)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        {log.recording_url && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => window.open(log.recording_url, '_blank')}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {log.transcription && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openTranscriptDialog(log)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Transcript Dialog */}
      <Dialog open={isTranscriptDialogOpen} onOpenChange={setIsTranscriptDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Call Transcript</DialogTitle>
          </DialogHeader>
          {selectedCallLog && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Contact:</span> {selectedCallLog.contact?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Phone:</span> {selectedCallLog.direction === 'inbound' ? selectedCallLog.caller_number : selectedCallLog.recipient_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Date:</span> {format(new Date(selectedCallLog.call_time), 'MMM d, yyyy h:mm a')}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Duration:</span> {formatDuration(selectedCallLog.duration)}
                  </p>
                </div>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Transcript</CardTitle>
                  <CardDescription>
                    Automatically generated from call recording
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{selectedCallLog.transcription}</p>
                </CardContent>
              </Card>
              
              {selectedCallLog.recording_url && (
                <div className="flex justify-center">
                  <audio controls src={selectedCallLog.recording_url} className="w-full">
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  onClick={() => handleCallContact(selectedCallLog.direction === 'inbound' ? selectedCallLog.caller_number : selectedCallLog.recipient_number)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Back
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 