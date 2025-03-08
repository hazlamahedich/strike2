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
import { getCallLogs, CallLog as CallLogType } from '@/lib/services/communicationService';
import { USE_MOCK_DATA } from '@/lib/config';

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

export default function CallLog({ onCallContact }: { onCallContact?: (phoneNumber: string) => void }) {
  const [callLogs, setCallLogs] = useState<CallLogType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedCallLog, setSelectedCallLog] = useState<CallLogType | null>(null);
  const [isTranscriptDialogOpen, setIsTranscriptDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch call logs on component mount
  useEffect(() => {
    const loadCallLogs = async () => {
      try {
        setIsLoading(true);
        const data = await getCallLogs();
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
  const openTranscriptDialog = (callLog: CallLogType) => {
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
        <h2 className="text-2xl font-bold">Call Log {USE_MOCK_DATA ? '(Mock Mode)' : ''}</h2>
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
      
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search call logs..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading call logs...</p>
        </div>
      ) : filteredCallLogs.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <Phone className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No call logs found</p>
          {searchTerm && (
            <Button 
              variant="link" 
              onClick={() => {
                setSearchTerm('');
                setFilterDirection('all');
                setFilterStatus('all');
              }}
            >
              Clear filters
            </Button>
          )}
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCallLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {log.contact?.name || 'Unknown'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {log.direction === 'inbound' ? log.caller_number : log.recipient_number}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {renderDirectionIcon(log.direction, log.status)}
                      <span className="ml-2 capitalize">{log.direction}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderStatusBadge(log.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{format(new Date(log.call_time), 'MMM d, yyyy')}</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(log.call_time), 'h:mm a')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.duration ? formatDuration(log.duration) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {log.transcription && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openTranscriptDialog(log)}
                        >
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">View Transcript</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCallContact(log.direction === 'inbound' ? log.caller_number : log.recipient_number)}
                      >
                        <Phone className="h-4 w-4" />
                        <span className="sr-only">Call Back</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Transcript Dialog */}
      <Dialog open={isTranscriptDialogOpen} onOpenChange={setIsTranscriptDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Call Transcript</DialogTitle>
          </DialogHeader>
          
          {selectedCallLog && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{selectedCallLog.contact?.name || 'Unknown'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedCallLog.direction === 'inbound' ? selectedCallLog.caller_number : selectedCallLog.recipient_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {format(new Date(selectedCallLog.call_time), 'MMM d, yyyy h:mm a')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {formatDuration(selectedCallLog.duration)}
                  </p>
                </div>
              </div>
              
              <div className="border rounded-md p-4 bg-muted/30">
                <p className="whitespace-pre-wrap">{selectedCallLog.transcription}</p>
              </div>
              
              {selectedCallLog.recording_url && (
                <div className="flex justify-center">
                  <audio controls src={selectedCallLog.recording_url} className="w-full">
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTranscriptDialogOpen(false)}>
              Close
            </Button>
            {selectedCallLog && (
              <Button onClick={() => handleCallContact(selectedCallLog.direction === 'inbound' ? selectedCallLog.caller_number : selectedCallLog.recipient_number)}>
                Call Back
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 