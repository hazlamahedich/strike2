'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function MockDataToggle() {
  const [isMockEnabled, setIsMockEnabled] = useState(false);
  
  // Initialize from localStorage on component mount
  useEffect(() => {
    const storedValue = localStorage.getItem('strike_app_mock_data');
    setIsMockEnabled(storedValue === 'true');
  }, []);
  
  // Handle toggle change
  const handleToggleChange = (checked: boolean) => {
    setIsMockEnabled(checked);
    localStorage.setItem('strike_app_mock_data', checked ? 'true' : 'false');
    
    // Show visual feedback
    const feedbackElem = document.createElement('div');
    feedbackElem.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
    feedbackElem.textContent = `Mock data mode ${checked ? 'enabled' : 'disabled'}`;
    document.body.appendChild(feedbackElem);
    
    // Remove feedback after 2 seconds
    setTimeout(() => {
      feedbackElem.remove();
    }, 2000);
  };
  
  return (
    <div className="flex items-center space-x-2">
      <Switch 
        id="mock-data-toggle" 
        checked={isMockEnabled}
        onCheckedChange={handleToggleChange}
      />
      <Label htmlFor="mock-data-toggle" className="text-xs cursor-pointer">
        Mock Data Mode
      </Label>
    </div>
  );
} 