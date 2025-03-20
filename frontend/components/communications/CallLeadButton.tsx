'use client';

import React, { ReactNode } from 'react';
import { Phone } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useLeadPhoneDialog } from '@/contexts/LeadPhoneDialogContext';

interface CallLeadButtonProps {
  leadId: string;
  leadName: string;
  phone?: string;
  email?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | null;
  size?: 'default' | 'sm' | 'lg' | 'icon' | null;
  className?: string;
  showTooltip?: boolean;
  children?: ReactNode;
}

export function CallLeadButton({
  leadId,
  leadName,
  phone = '',
  email = '',
  variant = 'ghost',
  size = 'icon',
  className = 'h-8 w-8',
  showTooltip = true,
  children
}: CallLeadButtonProps) {
  const { openPhoneDialog } = useLeadPhoneDialog();

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const lead = {
      id: leadId,
      name: leadName,
      phone,
      email
    };
    
    openPhoneDialog(lead);
  };

  const button = (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleCall}
    >
      {children || (
        <>
          <Phone className="h-4 w-4" />
          {size !== 'icon' && <span className="ml-2">Call</span>}
        </>
      )}
    </Button>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>Call Lead</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
} 