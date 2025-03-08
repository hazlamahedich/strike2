import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CampaignStatus, changeCampaignStatus } from '@/lib/utils/campaignUtils';
import { toast } from 'sonner';

interface CampaignStatusAlertProps {
  isOpen: boolean;
  onClose: () => void;
  status: CampaignStatus;
  actionType: 'lead' | 'activity';
  campaignId: string;
  onStatusChange?: (newStatus: CampaignStatus) => void;
}

const CampaignStatusAlert: React.FC<CampaignStatusAlertProps> = ({
  isOpen,
  onClose,
  status,
  actionType,
  campaignId,
  onStatusChange,
}) => {
  const [isActivating, setIsActivating] = useState(false);

  // Determine the message based on status and action type
  const getMessage = () => {
    if (status === 'completed') {
      return `This campaign is marked as completed. You cannot modify ${actionType}s for completed campaigns.`;
    } else if (status === 'paused' && actionType === 'activity') {
      return `This campaign is currently paused. You cannot modify ${actionType}s while the campaign is paused. Would you like to activate the campaign?`;
    } else if (status === 'cancelled') {
      return `This campaign has been cancelled. You cannot modify ${actionType}s for cancelled campaigns.`;
    }
    return `Cannot perform this action due to campaign status: ${status}`;
  };

  // Handle activating a paused campaign
  const handleActivateCampaign = async () => {
    if (!campaignId) return;
    
    try {
      setIsActivating(true);
      const updatedCampaign = await changeCampaignStatus(campaignId, 'active');
      
      if (onStatusChange) {
        onStatusChange('active');
      }
      
      toast.success('Campaign activated successfully');
      onClose();
    } catch (error) {
      console.error('Error activating campaign:', error);
      toast.error('Failed to activate campaign');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Campaign Status Restriction</AlertDialogTitle>
          <AlertDialogDescription>{getMessage()}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>
          {status === 'paused' && actionType === 'activity' && (
            <AlertDialogAction 
              onClick={handleActivateCampaign}
              disabled={isActivating}
            >
              {isActivating ? 'Activating...' : 'Activate Campaign'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CampaignStatusAlert; 