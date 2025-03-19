import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { runLowConversionWorkflow } from '@/lib/api/llm';
import { useSession } from 'next-auth/react';

interface AdminWorkflowControlsProps {
  onWorkflowComplete?: () => void;
}

const AdminWorkflowControls: React.FC<AdminWorkflowControlsProps> = ({ onWorkflowComplete }) => {
  const [isRunningWorkflow, setIsRunningWorkflow] = useState<boolean>(false);
  const { data: session } = useSession();
  
  // Check if user has admin or marketer role
  const isAdminOrMarketer = session?.user?.role === 'admin' || session?.user?.role === 'marketer';
  
  // If user is not admin or marketer, don't render the component
  if (!isAdminOrMarketer) {
    return null;
  }
  
  const handleRunWorkflow = async () => {
    setIsRunningWorkflow(true);
    try {
      const response = await runLowConversionWorkflow();
      
      if ('error' in response && response.error) {
        toast({
          title: 'Error',
          description: 'Failed to run workflow',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Success',
        description: 'Workflow executed successfully',
      });
      
      // Call the onWorkflowComplete callback if provided
      if (onWorkflowComplete) {
        onWorkflowComplete();
      }
    } catch (error) {
      console.error('Error running workflow:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsRunningWorkflow(false);
    }
  };
  
  return (
    <Button onClick={handleRunWorkflow} disabled={isRunningWorkflow} variant="outline">
      {isRunningWorkflow ? (
        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <ArrowRight className="w-4 h-4 mr-2" />
      )}
      Run Workflow
    </Button>
  );
};

export default AdminWorkflowControls; 