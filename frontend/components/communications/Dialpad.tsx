'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Phone, X, Plus, MessageSquare } from 'lucide-react';
import { Input } from '../ui/input';

interface DialpadProps {
  initialNumber?: string;
  onCall: (phoneNumber: string) => void;
  onSMS: (phoneNumber: string) => void;
}

export default function Dialpad({ initialNumber = '', onCall, onSMS }: DialpadProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialNumber);
  
  const handleKeyPress = (key: string) => {
    console.log("⭐⭐⭐ DIALPAD - Key pressed:", key);
    setPhoneNumber(prev => prev + key);
  };
  
  const handleDelete = () => {
    console.log("⭐⭐⭐ DIALPAD - Delete key pressed");
    setPhoneNumber(prev => prev.slice(0, -1));
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers, +, -, (, ), and spaces
    const value = e.target.value.replace(/[^\d+\-() ]/g, '');
    setPhoneNumber(value);
  };
  
  const handleCall = () => {
    console.log("⭐⭐⭐ DIALPAD - Call button pressed for:", phoneNumber);
    if (phoneNumber.trim() !== '') {
      onCall(phoneNumber);
    }
  };
  
  const handleSMS = () => {
    console.log("⭐⭐⭐ DIALPAD - SMS button pressed for:", phoneNumber);
    if (phoneNumber.trim() !== '') {
      onSMS(phoneNumber);
    }
  };
  
  const dialpadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];
  
  return (
    <div className="w-full max-w-sm">
      <div className="mb-4">
        <Input
          type="tel"
          value={phoneNumber}
          onChange={handleInputChange}
          placeholder="Enter phone number"
          className="text-center text-xl py-6"
        />
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        {dialpadKeys.map((row, rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            {row.map(key => (
              <Button
                key={key}
                variant="outline"
                className="aspect-square text-xl"
                onClick={() => handleKeyPress(key)}
              >
                {key}
              </Button>
            ))}
          </React.Fragment>
        ))}
        <Button
          variant="outline"
          className="aspect-square"
          onClick={() => handleKeyPress('+')}
        >
          <Plus className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          className="aspect-square"
          onClick={handleDelete}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={handleCall}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          <Phone className="mr-2 h-4 w-4" />
          Call
        </Button>
        <Button
          variant="secondary"
          onClick={handleSMS}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          SMS
        </Button>
      </div>
    </div>
  );
} 