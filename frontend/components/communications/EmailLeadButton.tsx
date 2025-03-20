'use client';

import React, { ReactNode } from 'react';
import { useEmailDialog } from '@/contexts/EmailDialogContext';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EmailLeadButtonProps {
  leadId: string;
  leadName: string;
  email?: string;
  phone?: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  children?: ReactNode;
}

export const EmailLeadButton: React.FC<EmailLeadButtonProps> = ({
  leadId,
  leadName,
  email,
  phone,
  className,
  size = 'default',
  variant = 'outline',
  children
}) => {
  const { openEmailDialog } = useEmailDialog();

  const handleEmailClick = () => {
    console.log('Emailing lead:', leadName);
    
    openEmailDialog({
      id: leadId,
      name: leadName,
      email,
      phone
    });
  };

  return (
    <Button 
      onClick={handleEmailClick}
      size={size}
      variant={variant}
      className={cn("text-primary", className)}
    >
      {children || (
        <>
          <Mail className={cn("mr-2", size === 'icon' ? 'mr-0' : 'mr-2')} size={size === 'icon' ? 18 : 16} />
          {size !== 'icon' && 'Email'}
        </>
      )}
    </Button>
  );
};

export default EmailLeadButton; 