import { useState } from 'react';
import { Lead } from '@/lib/types/lead';
import { ExitDecisionOption } from '@/lib/types/pipeline';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface ExitDecisionDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDecisionProcessed: () => void;
}

// Define process exit decision function directly here since we're having import issues
async function processExitDecision(
  leadId: number | string,
  decision: ExitDecisionOption, 
  reason: string,
  targetWorkflow?: string,
  targetPipeline?: string,
): Promise<{ 
  success: boolean; 
  action?: string;
  newStatus?: string;
  newWorkflow?: string;
  newPipeline?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/leads/${leadId}/process-exit-decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        decision,
        reason,
        targetWorkflow,
        targetPipeline
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'An error occurred' };
    }
    
    return {
      success: true,
      ...data
    };
  } catch (error) {
    console.error('Error processing exit decision:', error);
    return { success: false, error: 'Failed to process exit decision' };
  }
}

export function ExitDecisionDialog({
  lead,
  open,
  onOpenChange,
  onDecisionProcessed,
}: ExitDecisionDialogProps) {
  const [decision, setDecision] = useState<ExitDecisionOption | ''>('');
  const [reason, setReason] = useState('');
  const [targetWorkflow, setTargetWorkflow] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const availableWorkflows = [
    { id: 'inbound', name: 'Inbound Marketing' },
    { id: 'outbound', name: 'Outbound Sales' },
    { id: 'partner', name: 'Partner Channel' },
    { id: 'long_term', name: 'Long-term Nurture' },
  ];

  const handleSubmit = async () => {
    if (!lead || !decision) {
      toast({
        title: 'Invalid input',
        description: 'Please select a decision option',
        variant: 'destructive',
      });
      return;
    }

    if (decision === ExitDecisionOption.RECATEGORIZE && !targetWorkflow) {
      toast({
        title: 'Invalid input',
        description: 'Please select a target workflow for recategorization',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const result = await processExitDecision(
        lead.id,
        decision as ExitDecisionOption,
        reason,
        targetWorkflow
      );

      if (result.success) {
        let actionDescription = '';
        switch (decision) {
          case ExitDecisionOption.MARK_AS_LOST:
            actionDescription = 'marked as lost';
            break;
          case ExitDecisionOption.LONG_TERM_NURTURE:
            actionDescription = 'moved to long-term nurture';
            break;
          case ExitDecisionOption.RECATEGORIZE:
            actionDescription = `recategorized to ${targetWorkflow}`;
            break;
          case ExitDecisionOption.RETURN_TO_SALES:
            actionDescription = 'returned to sales pipeline';
            break;
          case ExitDecisionOption.CONTINUE_MONITORING:
            actionDescription = 'set to continue monitoring';
            break;
        }

        toast({
          title: 'Decision processed',
          description: `Lead "${lead.name}" has been ${actionDescription}`,
        });

        // Reset form and close dialog
        setDecision('');
        setReason('');
        setTargetWorkflow('');
        onOpenChange(false);
        onDecisionProcessed();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to process exit decision',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error processing exit decision:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exit Decision</DialogTitle>
          <DialogDescription>
            Decide the next steps for {lead?.name} who is currently in the Exit Decision stage.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="decision" className="text-right">
              Decision
            </Label>
            <Select
              value={decision}
              onValueChange={(value) => setDecision(value as ExitDecisionOption)}
              disabled={isProcessing}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ExitDecisionOption.MARK_AS_LOST}>
                  Mark as Lost
                </SelectItem>
                <SelectItem value={ExitDecisionOption.LONG_TERM_NURTURE}>
                  Move to Long-term Nurture
                </SelectItem>
                <SelectItem value={ExitDecisionOption.RECATEGORIZE}>
                  Recategorize to Different Workflow
                </SelectItem>
                <SelectItem value={ExitDecisionOption.RETURN_TO_SALES}>
                  Return to Sales Pipeline
                </SelectItem>
                <SelectItem value={ExitDecisionOption.CONTINUE_MONITORING}>
                  Continue Monitoring
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {decision === ExitDecisionOption.RECATEGORIZE && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetWorkflow" className="text-right">
                Target Workflow
              </Label>
              <Select
                value={targetWorkflow}
                onValueChange={setTargetWorkflow}
                disabled={isProcessing}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select target workflow" />
                </SelectTrigger>
                <SelectContent>
                  {availableWorkflows.map((workflow) => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">
              Reason
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide reasoning for this decision"
              className="col-span-3"
              disabled={isProcessing}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Process Decision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 