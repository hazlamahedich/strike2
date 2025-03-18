'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Send } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface SMSComposerProps {
  phoneNumber: string;
  onSend: (to: string, body: string) => void;
}

export default function SMSComposer({ phoneNumber = '', onSend }: SMSComposerProps) {
  const [to, setTo] = useState(phoneNumber);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [charCount, setCharCount] = useState(0);
  
  const MAX_SMS_LENGTH = 160;
  
  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTo(e.target.value);
  };
  
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMessage(text);
    setCharCount(text.length);
  };
  
  const handleSend = async () => {
    if (!to || !message) return;
    
    console.log("⭐⭐⭐ SMS COMPOSER - Sending message to:", to);
    setIsSending(true);
    
    try {
      onSend(to, message);
      setMessage('');
      setCharCount(0);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };
  
  const getCharCountColor = () => {
    if (charCount > MAX_SMS_LENGTH) {
      return 'text-red-500';
    }
    if (charCount > MAX_SMS_LENGTH * 0.8) {
      return 'text-yellow-500';
    }
    return 'text-muted-foreground';
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="to">To:</Label>
        <Input
          id="to"
          type="tel"
          value={to}
          onChange={handleToChange}
          placeholder="Enter phone number"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="message">Message:</Label>
          <span className={`text-xs ${getCharCountColor()}`}>
            {charCount}/{MAX_SMS_LENGTH}
            {charCount > MAX_SMS_LENGTH ? ' (Will be split into multiple messages)' : ''}
          </span>
        </div>
        
        <Textarea
          id="message"
          value={message}
          onChange={handleMessageChange}
          placeholder="Type your message here..."
          className="min-h-[120px]"
        />
      </div>
      
      <Button
        className="w-full"
        onClick={handleSend}
        disabled={isSending || !to || !message}
      >
        <Send className="mr-2 h-4 w-4" />
        {isSending ? 'Sending...' : 'Send Message'}
      </Button>
    </div>
  );
} 