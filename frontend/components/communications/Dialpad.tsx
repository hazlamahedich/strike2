import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  UserPlus, 
  MoreVertical,
  Pause,
  Play
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Contact } from '@/lib/services/communicationService';
import { makeCall } from '@/lib/services/communicationService';

// Define the call state type
type CallState = 'idle' | 'connecting' | 'connected' | 'completed' | 'failed' | 'busy' | 'no-answer' | 'canceled' | 'on-hold';

// Define the trunk line type
interface TrunkLine {
  id: string;
  name: string;
  phoneNumber: string;
}

// Mock API functions (replace with actual API calls)
const initiateCall = async (to: string, from: string): Promise<{ callSid: string }> => {
  // In a real app, this would be an API call to your backend
  console.log(`Initiating call from ${from} to ${to}`);
  return { callSid: `CA${Math.random().toString(36).substring(2, 15)}` };
};

const endCall = async (callSid: string): Promise<boolean> => {
  // In a real app, this would be an API call to your backend
  console.log(`Ending call ${callSid}`);
  return true;
};

const sendDtmf = async (callSid: string, digits: string): Promise<boolean> => {
  // In a real app, this would be an API call to your backend
  console.log(`Sending DTMF ${digits} for call ${callSid}`);
  return true;
};

const toggleMute = async (callSid: string, muted: boolean): Promise<boolean> => {
  // In a real app, this would be an API call to your backend
  console.log(`Setting mute to ${muted} for call ${callSid}`);
  return true;
};

const toggleHold = async (callSid: string, onHold: boolean): Promise<boolean> => {
  // In a real app, this would be an API call to your backend
  console.log(`Setting hold to ${onHold} for call ${callSid}`);
  return true;
};

// Mock trunk lines
const trunkLines: TrunkLine[] = [
  { id: '1', name: 'Main Office', phoneNumber: '+1234567890' },
  { id: '2', name: 'Sales Team', phoneNumber: '+0987654321' },
  { id: '3', name: 'Support', phoneNumber: '+1122334455' }
];

interface DialpadProps {
  initialPhoneNumber?: string;
  contact?: Contact;
  onCallComplete?: (callSid: string, duration: number) => void;
  lead_id?: number;
}

export default function Dialpad({ initialPhoneNumber, contact, onCallComplete, lead_id }: DialpadProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || '');
  const [selectedTrunkLine, setSelectedTrunkLine] = useState<TrunkLine>(trunkLines[0]);
  const [callState, setCallState] = useState<CallState>('idle');
  const [callSid, setCallSid] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isDialpadOpen, setIsDialpadOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Update phone number when contact changes
  useEffect(() => {
    if (contact) {
      setPhoneNumber(contact.phone_number);
    }
  }, [contact]);

  // Handle phone number input
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  };

  // Handle digit button click
  const handleDigitClick = (digit: string) => {
    if (callState === 'connected') {
      // If in a call, send DTMF tone
      if (callSid) {
        sendDtmf(callSid, digit);
      }
    }
    
    // Always update the input field
    setPhoneNumber(prev => prev + digit);
  };

  // Format seconds to MM:SS
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Start call timer
  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // Stop call timer
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Handle initiating a call
  const handleCall = async () => {
    if (!phoneNumber) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number',
        variant: 'destructive'
      });
      return;
    }
    
    setCallState('connecting');
    setCallDuration(0);
    
    try {
      // Use the makeCall function from the service
      const result = await makeCall({
        to: phoneNumber,
        from: selectedTrunkLine.phoneNumber,
        lead_id: lead_id
      });
      
      if (result.success) {
        setCallSid(result.call_id || '');
        setCallState('connected');
        startTimer();
        
        toast({
          title: 'Call Connected',
          description: `Connected to ${phoneNumber}`,
        });
      } else {
        throw new Error(result.message || 'Failed to connect call');
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      setCallState('failed');
      toast({
        title: 'Call Failed',
        description: 'Failed to connect the call. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle ending a call
  const handleEndCall = async () => {
    if (!callSid) return;
    
    try {
      await endCall(callSid);
      stopTimer();
      
      if (onCallComplete) {
        onCallComplete(callSid, callDuration);
      }
      
      setCallState('completed');
      setIsMuted(false);
      setIsOnHold(false);
      
      toast({
        title: 'Call Ended',
        description: `Call duration: ${formatDuration(callDuration)}`,
      });
      
      // Reset after a short delay
      setTimeout(() => {
        setCallSid(null);
        setCallState('idle');
        setCallDuration(0);
      }, 2000);
    } catch (error) {
      console.error('Failed to end call:', error);
      toast({
        title: 'Error',
        description: 'Failed to end the call. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle toggling mute
  const handleToggleMute = async () => {
    if (!callSid || callState !== 'connected') return;
    
    try {
      const newMuteState = !isMuted;
      await toggleMute(callSid, newMuteState);
      setIsMuted(newMuteState);
      
      toast({
        title: newMuteState ? 'Call Muted' : 'Call Unmuted',
        description: newMuteState ? 'Microphone is now muted' : 'Microphone is now active',
      });
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      toast({
        title: 'Error',
        description: 'Failed to change mute state. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle toggling hold
  const handleToggleHold = async () => {
    if (!callSid || callState !== 'connected') return;
    
    try {
      const newHoldState = !isOnHold;
      await toggleHold(callSid, newHoldState);
      setIsOnHold(newHoldState);
      
      if (newHoldState) {
        setCallState('on-hold');
      } else {
        setCallState('connected');
      }
      
      toast({
        title: newHoldState ? 'Call On Hold' : 'Call Resumed',
        description: newHoldState ? 'The call has been placed on hold' : 'The call has been resumed',
      });
    } catch (error) {
      console.error('Failed to toggle hold:', error);
      toast({
        title: 'Error',
        description: 'Failed to change hold state. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Render call status badge
  const renderCallStatusBadge = () => {
    switch (callState) {
      case 'connecting':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Connecting...</Badge>;
      case 'connected':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Connected</Badge>;
      case 'on-hold':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">On Hold</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      case 'busy':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Busy</Badge>;
      case 'no-answer':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">No Answer</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Canceled</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Dialpad</span>
          {callState !== 'idle' && renderCallStatusBadge()}
        </CardTitle>
        <CardDescription>
          {contact ? `Calling ${contact.name}` : 'Enter a number to call'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            type="tel"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            disabled={callState !== 'idle'}
            className="flex-1"
          />
          <Select 
            value={selectedTrunkLine.id} 
            onValueChange={(value) => setSelectedTrunkLine(trunkLines.find(line => line.id === value) || trunkLines[0])}
            disabled={callState !== 'idle'}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select line" />
            </SelectTrigger>
            <SelectContent>
              {trunkLines.map(line => (
                <SelectItem key={line.id} value={line.id}>
                  {line.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {callState === 'connected' || callState === 'on-hold' ? (
          <div className="text-center py-2">
            <div className="text-2xl font-bold">{formatDuration(callDuration)}</div>
            <div className="text-sm text-gray-500">
              {contact?.name || phoneNumber}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={() => handleDigitClick('1')}>1</Button>
          <Button variant="outline" onClick={() => handleDigitClick('2')}>2</Button>
          <Button variant="outline" onClick={() => handleDigitClick('3')}>3</Button>
          <Button variant="outline" onClick={() => handleDigitClick('4')}>4</Button>
          <Button variant="outline" onClick={() => handleDigitClick('5')}>5</Button>
          <Button variant="outline" onClick={() => handleDigitClick('6')}>6</Button>
          <Button variant="outline" onClick={() => handleDigitClick('7')}>7</Button>
          <Button variant="outline" onClick={() => handleDigitClick('8')}>8</Button>
          <Button variant="outline" onClick={() => handleDigitClick('9')}>9</Button>
          <Button variant="outline" onClick={() => handleDigitClick('*')}>*</Button>
          <Button variant="outline" onClick={() => handleDigitClick('0')}>0</Button>
          <Button variant="outline" onClick={() => handleDigitClick('#')}>#</Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {callState === 'idle' ? (
          <Button 
            className="w-full bg-green-600 hover:bg-green-700" 
            onClick={handleCall}
          >
            <Phone className="mr-2 h-4 w-4" />
            Call
          </Button>
        ) : (
          <div className="flex w-full justify-between space-x-2">
            <Button 
              variant={isMuted ? "default" : "outline"} 
              onClick={handleToggleMute}
              disabled={callState !== 'connected' && callState !== 'on-hold'}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            
            <Button 
              variant={isOnHold ? "default" : "outline"} 
              onClick={handleToggleHold}
              disabled={callState !== 'connected' && callState !== 'on-hold'}
            >
              {isOnHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={handleEndCall}
              disabled={callState !== 'connected' && callState !== 'on-hold'}
              className="flex-1"
            >
              <PhoneOff className="mr-2 h-4 w-4" />
              End Call
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 