import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from '@/pages/api/auth/mock-nextauth'; // Use mock for development
import { LeadStatus } from '@/lib/types/lead';
import { ExitDecisionOption } from '@/lib/types/pipeline';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get session for auth check
  const session = await getServerSession(req, res);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { id } = req.query;
    const { decision, reason, targetPipeline, targetWorkflow } = req.body;

    if (!id || !decision) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    let newStatus = LeadStatus.STALLED;
    let result: any = { success: true };
    
    // Process the exit decision
    switch (decision) {
      case ExitDecisionOption.MARK_AS_LOST:
        // Update lead status to closed lost
        newStatus = LeadStatus.CLOSED_LOST;
        console.log(`Lead ${id} marked as lost: ${reason}`);
        result = {
          success: true,
          action: 'marked_as_lost',
          newStatus
        };
        break;
        
      case ExitDecisionOption.LONG_TERM_NURTURE:
        // Move lead to long-term nurture program/workflow
        console.log(`Lead ${id} moved to long-term nurture program`);
        result = {
          success: true,
          action: 'moved_to_long_term_nurture',
          newStatus,
          newWorkflow: 'long_term_nurture'
        };
        break;
        
      case ExitDecisionOption.RECATEGORIZE:
        // Move lead to different pipeline/workflow
        if (!targetWorkflow) {
          return res.status(400).json({ error: 'Target workflow is required for recategorization' });
        }
        console.log(`Lead ${id} recategorized to ${targetWorkflow}`);
        result = {
          success: true,
          action: 'recategorized',
          newStatus,
          newWorkflow: targetWorkflow
        };
        break;
        
      case ExitDecisionOption.RETURN_TO_SALES:
        // Move lead back to sales pipeline
        newStatus = LeadStatus.QUALIFIED;
        console.log(`Lead ${id} returned to sales pipeline`);
        result = {
          success: true,
          action: 'returned_to_sales',
          newStatus,
          newPipeline: 'sales'
        };
        break;
        
      case ExitDecisionOption.CONTINUE_MONITORING:
        // Keep in exit decision but continue monitoring
        console.log(`Lead ${id} will continue to be monitored`);
        result = {
          success: true,
          action: 'continue_monitoring',
          newStatus
        };
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid exit decision option' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in process-exit-decision API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 